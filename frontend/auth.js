// auth.js
// Shared helpers for checking login state and gating actions.
// Every page that cares about login should include this with:
//   <script src="auth.js"></script>
//
// DEV NOTE: when a page is opened directly from the filesystem (file://)
// instead of through the server (http://localhost:3001), auth guards are
// disabled. This lets us preview/design pages without booting the backend.
// To exercise the real auth flow, always go through http://localhost:3001/.

// ---- Storage keys (defined in one place so we don't typo them) ----
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const REDIRECT_KEY = 'redirectAfterLogin';

// True when the page was opened directly from the filesystem (file://...).
// In that mode there's no API to call and no real auth session, so we skip
// auth guards so design work doesn't get bounced to the login page.
const IS_DESIGN_PREVIEW = window.location.protocol === 'file:';

// ---- Read helpers ----

// Return the JWT string, or null if there is none.
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Return the cached user object ({ id, name, email, ... }), or null.
// We JSON.parse because login.html stored it with JSON.stringify.
function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Stored value was corrupted somehow. Treat as logged out.
    return null;
  }
}

// True if a token exists. (We're not validating expiration here —
// that requires a round-trip to /api/auth/me. Good enough for UI gating.)
function isLoggedIn() {
  return getToken() !== null;
}

// True if the cached user record says they've verified their email.
// Used to gate actions like applying to events. Note: trusts the cached
// flag for UI purposes — the backend re-checks anything that matters.
function isEmailVerified() {
  if (IS_DESIGN_PREVIEW) return true; // don't block design work
  const u = getUser();
  return !!(u && u.email_verified);
}

// Refresh the cached user object from the server. Useful right after the
// user verifies their email in another tab, so the current tab picks up
// the new email_verified flag without a manual reload. Returns the fresh
// user or null if not logged in / token expired.
async function refreshUser() {
  if (!isLoggedIn()) return null;
  try {
    const res = await fetch('/api/auth/me', { headers: authHeader() });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    }
  } catch {}
  return null;
}

// ---- Action helpers ----

// Clear the session and send the user somewhere sensible.
// Default destination is the landing page so logout feels like
// "going home", not "being kicked out".
function logout(redirectTo = 'csus-landing-page-events.html') {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REDIRECT_KEY);
  window.location.href = redirectTo;
}

// Gate a protected action. Call this when the user clicks something
// that needs them to be logged in (e.g., "Apply" on an event).
//
// If they're already logged in: returns true and the caller proceeds.
// If they're not: stashes the current page so login.html can bounce
// them back here afterward, then redirects to login. Returns false so
// the caller can early-return.
//
// Usage:
//   function handleApply() {
//     if (!requireLogin()) return;
//     // ...rest of apply logic
//   }
function requireLogin(redirectBack) {
  // Design preview mode: opened via file:// — let the page render so we can
  // style it without standing up the server. See DEV NOTE at top of file.
  if (IS_DESIGN_PREVIEW) return true;

  if (isLoggedIn()) return true;

  // Default to the page we're currently on.
  const target = redirectBack || (window.location.pathname.split('/').pop() || 'csus-landing-page-events.html');
  localStorage.setItem(REDIRECT_KEY, target);
  window.location.href = 'login.html';
  return false;
}

// Pull the saved "where was I going?" value and clear it.
// login.html should call this after a successful login to decide
// where to send the user. Falls back to the landing page.
function consumeRedirectAfterLogin() {
  const target = localStorage.getItem(REDIRECT_KEY);
  localStorage.removeItem(REDIRECT_KEY);
  return target || 'csus-landing-page-events.html';
}

// Convenience for fetch() calls that need to send the JWT.
//   fetch('/api/whatever', { headers: authHeader() })
function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
