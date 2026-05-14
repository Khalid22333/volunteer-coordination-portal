// email.js
//
// Outbound email for the Career Center Portal.
//
// Two modes, decided at runtime by whether SMTP_HOST is set:
//
//   1. SMTP MODE (production / staging) — when SMTP_HOST is in the env we
//      use nodemailer to send through the configured SMTP server (SendGrid,
//      Gmail, Mailgun, whatever). This is what real users see.
//
//   2. CONSOLE MODE (development) — when SMTP_HOST is NOT set we don't
//      send anything; we print the email contents (recipient, subject,
//      body, and most importantly the verification link) to the server
//      terminal in a clearly-formatted block. This lets the whole
//      verification flow be tested end-to-end without ever signing up
//      for a mail provider. To "verify your email" in dev, you just
//      copy the link out of the terminal and paste it in your browser.
//
// To switch from console to real SMTP later, set these env vars in
// server/.env:
//   SMTP_HOST=smtp.sendgrid.net          (or smtp.gmail.com, etc.)
//   SMTP_PORT=587
//   SMTP_USER=apikey                     (SendGrid uses literal "apikey")
//   SMTP_PASS=<your-key-or-app-password>
//   MAIL_FROM="CSUS Career Center <noreply@your-domain.example>"
//   PUBLIC_BASE_URL=https://your-deployed-host.example
//
// In dev, only PUBLIC_BASE_URL matters (defaults to http://localhost:3001).

const nodemailer = require('nodemailer');

// Resolve a base URL once at module load. Verification links go in emails
// that may be opened on a different machine, so we can't rely on the
// request's Host header — the deployer has to tell us what the public URL is.
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

// Build the transporter once. In console mode we don't need one, so we
// just leave it as null and the sender function checks.
let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // 465 = implicit TLS
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  console.log(`[email] SMTP mode enabled via ${process.env.SMTP_HOST}`);
} else {
  console.log('[email] CONSOLE mode — verification emails will be printed here, not sent.');
}

const FROM = process.env.MAIL_FROM || 'CSUS Career Center <noreply@example.com>';

/**
 * Render a verification email for a brand-new account.
 * Returns { subject, text, html } — pure data, no I/O. Kept separate so
 * tests can assert on the contents without going through nodemailer.
 */
function renderVerificationEmail({ name, link }) {
  const subject = 'Verify your CSUS Career Center account';
  const text = [
    `Hi ${name || 'there'},`,
    '',
    'Thanks for signing up for the CSUS Career Center volunteer portal!',
    'To finish creating your account, click the link below:',
    '',
    link,
    '',
    'This link expires in 24 hours. If you didn\'t create this account,',
    'you can safely ignore this email — no account will be activated.',
    '',
    '— CSUS Career Center',
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #3a5a2e; margin-top: 0;">Verify your email</h2>
      <p>Hi ${escapeHtml(name || 'there')},</p>
      <p>Thanks for signing up for the CSUS Career Center volunteer portal! To finish creating your account, click the button below:</p>
      <p style="margin: 28px 0;">
        <a href="${link}"
           style="display: inline-block; background: #3a5a2e; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600;">
          Verify my email
        </a>
      </p>
      <p style="font-size: 0.9em; color: #555;">Or paste this link into your browser:<br><span style="word-break: break-all;">${link}</span></p>
      <p style="font-size: 0.85em; color: #888;">This link expires in 24 hours. If you didn't create this account, you can ignore this email — no account will be activated.</p>
    </div>
  `;
  return { subject, text, html };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/**
 * Build the full verification URL for a given token. Centralized so the
 * route handler and the email template can't drift.
 */
function buildVerificationLink(token) {
  return `${PUBLIC_BASE_URL}/verify-email.html?token=${encodeURIComponent(token)}`;
}

/**
 * Build the full password-reset URL for a given token.
 */
function buildPasswordResetLink(token) {
  return `${PUBLIC_BASE_URL}/reset-password.html?token=${encodeURIComponent(token)}`;
}

/**
 * Render a password-reset email. Kept parallel to renderVerificationEmail —
 * same structure, different copy. Intentionally vague about whether the
 * recipient even has an account: the forgot-password endpoint sends the
 * same response regardless, so the email language follows suit.
 */
function renderPasswordResetEmail({ name, link }) {
  const subject = 'Reset your CSUS Career Center password';
  const text = [
    `Hi ${name || 'there'},`,
    '',
    'We received a request to reset the password on your CSUS Career Center',
    'volunteer portal account. To choose a new password, click the link below:',
    '',
    link,
    '',
    'This link expires in 1 hour. If you didn\'t request a password reset,',
    'you can safely ignore this email — your password won\'t change.',
    '',
    '— CSUS Career Center',
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #3a5a2e; margin-top: 0;">Reset your password</h2>
      <p>Hi ${escapeHtml(name || 'there')},</p>
      <p>We received a request to reset the password on your CSUS Career Center volunteer portal account. To choose a new password, click the button below:</p>
      <p style="margin: 28px 0;">
        <a href="${link}"
           style="display: inline-block; background: #3a5a2e; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600;">
          Reset my password
        </a>
      </p>
      <p style="font-size: 0.9em; color: #555;">Or paste this link into your browser:<br><span style="word-break: break-all;">${link}</span></p>
      <p style="font-size: 0.85em; color: #888;">This link expires in 1 hour. If you didn't request a password reset, you can ignore this email — your password won't change.</p>
    </div>
  `;
  return { subject, text, html };
}

/**
 * Send (or log, in dev) the verification email for a newly-issued token.
 * Returns the link, mostly for tests/logging.
 */
async function sendVerificationEmail({ to, name, token }) {
  const link = buildVerificationLink(token);
  const { subject, text, html } = renderVerificationEmail({ name, link });

  if (!transporter) {
    // Console mode — make the link impossible to miss in the server log.
    const banner = '═'.repeat(72);
    console.log(`\n${banner}`);
    console.log('  [email] (CONSOLE MODE) Would send verification email');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Verify:  ${link}`);
    console.log(`${banner}\n`);
    return { link, mode: 'console' };
  }

  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    text,
    html,
  });
  return { link, mode: 'smtp' };
}

/**
 * Send (or log, in dev) a password-reset email. Mirrors
 * sendVerificationEmail — same dev/prod behavior, different copy/link.
 */
async function sendPasswordResetEmail({ to, name, token }) {
  const link = buildPasswordResetLink(token);
  const { subject, text, html } = renderPasswordResetEmail({ name, link });

  if (!transporter) {
    const banner = '═'.repeat(72);
    console.log(`\n${banner}`);
    console.log('  [email] (CONSOLE MODE) Would send password-reset email');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Reset:   ${link}`);
    console.log(`${banner}\n`);
    return { link, mode: 'console' };
  }

  await transporter.sendMail({ from: FROM, to, subject, text, html });
  return { link, mode: 'smtp' };
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  buildVerificationLink,
  buildPasswordResetLink,
  renderVerificationEmail,    // exported for tests
  renderPasswordResetEmail,   // exported for tests
  PUBLIC_BASE_URL,
};
