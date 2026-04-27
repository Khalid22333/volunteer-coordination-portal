const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dns = require('dns').promises;
const db = require('../db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../email');

const router = express.Router();
const SALT_ROUNDS = 10;

// Random tokens for email verification AND password reset are 32 random
// bytes hex-encoded (64 chars). That's 256 bits of entropy — unguessable,
// even at internet scale.
const TOKEN_BYTES = 32;
const VERIFICATION_TTL_HOURS = 24;
// Password reset windows are intentionally short — the link sits in an
// inbox and we want to limit how long a leaked email exposes the account.
const PASSWORD_RESET_TTL_HOURS = 1;

function newRandomToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

// Backwards-compatible alias for the verification-token call sites.
function newVerificationToken() {
  return newRandomToken();
}

// MySQL DATETIME formatted, since we send this directly to db.execute.
// Caller passes the TTL in hours so the same helper serves both token kinds.
function expiryFromNow(hours) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Convenience wrappers, so the call sites read clearly.
function verificationTokenExpiry() { return expiryFromNow(VERIFICATION_TTL_HOURS); }
function passwordResetTokenExpiry() { return expiryFromNow(PASSWORD_RESET_TTL_HOURS); }

// Reasonable email format check. Not full RFC 5322 (that regex is hundreds
// of chars), but it rejects whitespace, missing @, missing TLD, and
// short/garbage TLDs while accepting the realistic shapes our users will
// type (foo.bar+tag@sub.example.edu, etc.).
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Returns true if the domain advertises a way to receive email. We try MX
// records first (the standard) and fall back to A/AAAA, since RFC 5321 §5.1
// allows a host to accept mail at its address record when no MX exists.
// Any DNS failure (NXDOMAIN, timeout) is treated as "not a real domain".
async function domainAcceptsEmail(domain) {
  try {
    const mx = await dns.resolveMx(domain);
    if (mx && mx.length > 0) return true;
  } catch (_) {
    // fall through to A/AAAA check
  }
  try {
    const a = await dns.resolve(domain).catch(() => null);
    if (a && a.length > 0) return true;
  } catch (_) {}
  try {
    const aaaa = await dns.resolve6(domain).catch(() => null);
    if (aaaa && aaaa.length > 0) return true;
  } catch (_) {}
  return false;
}

// Helper: create a JWT for a given user
function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Middleware: verify the Authorization header's Bearer token
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  // Normalize so we don't store "Foo@Example.COM " and "foo@example.com" as
  // two different accounts.
  const normalizedEmail = String(email).trim().toLowerCase();

  // 1. Format check.
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ error: 'please enter a valid email address' });
  }

  // 2. Domain check. We require the domain to actually exist and accept
  //    mail, which catches typos like "gmial.com" and made-up domains.
  const domain = normalizedEmail.split('@')[1];
  const accepts = await domainAcceptsEmail(domain);
  if (!accepts) {
    return res.status(400).json({
      error: `the email domain "${domain}" doesn't appear to accept mail — please check for typos`
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = newVerificationToken();
    const expiresAt = verificationTokenExpiry();

    const [result] = await db.execute(
      `INSERT INTO users
         (name, email, password_hash, email_verified,
          verification_token, verification_token_expires_at)
       VALUES (?, ?, ?, FALSE, ?, ?)`,
      [name, normalizedEmail, passwordHash, verificationToken, expiresAt]
    );

    // Fire-and-await the email send so the user only sees a 201 once we
    // know the email step at least dispatched. In console mode this is
    // ~instant; with a real SMTP provider it can take a beat.
    try {
      await sendVerificationEmail({
        to: normalizedEmail,
        name,
        token: verificationToken,
      });
    } catch (mailErr) {
      // Don't fail the signup if mail dispatch hiccups — the row is
      // already created and they can hit "Resend" from the UI.
      console.error('[signup] verification email failed to send:', mailErr.message);
    }

    const user = {
      id: result.insertId,
      name,
      email: normalizedEmail,
      email_verified: false,
    };
    const jwtToken = signToken(user);
    res.status(201).json({ user, token: jwtToken });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'email already registered' });
    }
    console.error('Signup error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, password_hash, email_verified FROM users WHERE email = ?',
      [String(email).trim().toLowerCase()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const row = rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    // Lenient policy: unverified users CAN log in, but the frontend gates
    // applying-to-events on email_verified. Surfacing the flag here lets it
    // render the right "please verify" UI without an extra round-trip.
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      email_verified: !!row.email_verified,
    };
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /api/auth/me  (requires a valid token)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, email_verified, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'user not found' });
    }
    const u = rows[0];
    res.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        email_verified: !!u.email_verified,
        created_at: u.created_at,
      },
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /api/auth/verify-email?token=...
//
// Public endpoint. The link in the verification email points at the
// frontend page (/verify-email.html) which extracts ?token=... and calls
// this endpoint. We return JSON; the frontend renders the user-facing UI.
router.get('/verify-email', async (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    return res.status(400).json({ error: 'missing token' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT id, name, email, email_verified, verification_token_expires_at
         FROM users
        WHERE verification_token = ?`,
      [token]
    );

    if (rows.length === 0) {
      // Could be: never existed, already used (we clear it on success), or
      // a typo. We use the same generic message either way so we don't
      // leak which.
      return res.status(400).json({ error: 'invalid or expired verification link' });
    }

    const u = rows[0];

    // Already verified — make this idempotent so reloading the link
    // doesn't show a scary error.
    if (u.email_verified) {
      return res.json({ ok: true, alreadyVerified: true, email: u.email });
    }

    // Expired? Tell the user explicitly so they know to hit "resend".
    if (u.verification_token_expires_at && new Date(u.verification_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'this verification link has expired — request a new one' });
    }

    await db.execute(
      `UPDATE users
          SET email_verified = TRUE,
              verification_token = NULL,
              verification_token_expires_at = NULL
        WHERE id = ?`,
      [u.id]
    );

    res.json({ ok: true, email: u.email });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/auth/resend-verification
//
// Requires a logged-in user. Issues a fresh token and re-sends the email.
// Scoped to the caller's own account so it can't be used to spam someone
// else's inbox.
router.post('/resend-verification', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, email_verified FROM users WHERE id = ?',
      [req.user.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'user not found' });
    }
    const u = rows[0];
    if (u.email_verified) {
      return res.json({ ok: true, alreadyVerified: true });
    }

    const token = newVerificationToken();
    const expiresAt = verificationTokenExpiry();
    await db.execute(
      `UPDATE users
          SET verification_token = ?, verification_token_expires_at = ?
        WHERE id = ?`,
      [token, expiresAt, u.id]
    );

    try {
      await sendVerificationEmail({ to: u.email, name: u.name, token });
    } catch (mailErr) {
      console.error('[resend] mail send failed:', mailErr.message);
      return res.status(500).json({ error: 'could not send email — try again in a moment' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/auth/forgot-password
//
// Public endpoint. Issues a password-reset token and emails the link, IF
// the email matches an account. We always respond with the same generic
// 200 either way so attackers can't use this endpoint to enumerate which
// emails are registered. (User-facing copy on the frontend reflects this:
// "If an account exists, we sent a link.")
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  // Even on input we don't want to bail with a different status code
  // depending on validity — same generic response regardless. So we
  // only do the work if the input *looks* like an email; bad input
  // silently no-ops.
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.json({ ok: true });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      const u = rows[0];
      const token = newRandomToken();
      const expiresAt = passwordResetTokenExpiry();
      await db.execute(
        `UPDATE users
            SET password_reset_token = ?, password_reset_token_expires_at = ?
          WHERE id = ?`,
        [token, expiresAt, u.id]
      );
      try {
        await sendPasswordResetEmail({ to: u.email, name: u.name, token });
      } catch (mailErr) {
        // Don't surface mail failures to the caller — that would leak
        // account existence. Log for ops and move on.
        console.error('[forgot-password] mail send failed:', mailErr.message);
      }
    }

    // Same response whether the email matched or not.
    res.json({ ok: true });
  } catch (err) {
    console.error('Forgot-password error:', err);
    // Even on a DB error, return the generic OK so we don't leak signal.
    // The caller's UI says "if an account exists…" either way.
    res.json({ ok: true });
  }
});

// POST /api/auth/reset-password
//
// Public endpoint. Accepts { token, password } and, if the token is
// valid + unexpired, hashes and stores the new password, clears the
// reset token, and (since clicking the link proves email ownership)
// also marks the account email_verified.
router.post('/reset-password', async (req, res) => {
  const token = String(req.body.token || '').trim();
  const password = String(req.body.password || '');

  if (!token) {
    return res.status(400).json({ error: 'missing token' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT id, email, password_reset_token_expires_at
         FROM users
        WHERE password_reset_token = ?`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'invalid or expired reset link' });
    }

    const u = rows[0];
    if (u.password_reset_token_expires_at && new Date(u.password_reset_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'this reset link has expired — request a new one' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await db.execute(
      `UPDATE users
          SET password_hash = ?,
              password_reset_token = NULL,
              password_reset_token_expires_at = NULL,
              email_verified = TRUE,
              verification_token = NULL,
              verification_token_expires_at = NULL
        WHERE id = ?`,
      [passwordHash, u.id]
    );

    res.json({ ok: true, email: u.email });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;