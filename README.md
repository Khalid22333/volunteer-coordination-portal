# Career Center Volunteer Coordination Portal

**California State University, Sacramento**
**College of Engineering and Computer Science**
**CSC 131 – Computer Software Engineering | Spring 2026**
**Group 9**

---

## Project Overview

The Career Center Volunteer Coordination Portal is a web-based system designed to modernize and streamline the process of recruiting, managing, and communicating with volunteers for Career Center events at Sacramento State.

This portal replaces inefficient methods like email announcements and physical sign-up sheets with a centralized platform that improves visibility, simplifies sign-ups, and reduces administrative workload.

---

## Team Members

| Name | Role |
|------|------|
| Dylan Hulett | |
| Jayden Brown | |
| Manjot Dhaliwal | |
| Khalid Abid | |
| Anna Kubrak | |

---

## Features

### Implemented

- Account registration and login (JWT, bcrypt-hashed passwords stored in MySQL)
- Email validation on sign-up: strict format regex plus a DNS lookup (MX records, with A/AAAA fallback) so typos like `gmial.com` and made-up domains are rejected before the account row is written
- Email verification via confirmation link: sign-up issues a 24-hour token and triggers a verification email; clicking the link on `/verify-email.html` flips the account to verified. Unverified users can still log in and browse, but the Apply button prompts them to verify (with one-click resend). The signup screen also shows a "Check your email" panel after registering, with a Resend button. Sending uses **nodemailer**; with no SMTP env vars set the email contents are printed to the server terminal so the flow can be tested without signing up for a mail provider.
- Forgot-password flow: the "Forgot password?" link on login leads to `/forgot-password.html`, which submits an email to `/api/auth/forgot-password` and always returns the same generic confirmation regardless of whether an account exists (so the endpoint can't be used to enumerate registered emails). When the email *does* match an account, the server issues a 1-hour reset token and emails (or console-logs) a link to `/reset-password.html`, where the user picks a new password. A successful reset also marks the account as `email_verified` (clicking a link delivered to the inbox is itself proof of ownership) and clears any cached login session in `localStorage` so the new password is required.
- Auth-aware navigation: protected actions (e.g. "Apply" on an event) prompt for login and bounce the user back where they were after sign-in
- Public landing page with upcoming events, served from the database
- Profile customization page styled to match the landing page (form fields wired up; backend save still in progress)
- Single-origin deployment: Express serves both the API and the static frontend at `http://localhost:3001/`
- Design-preview mode: pages opened directly via `file://` skip the auth guards, so the team can iterate on styling without booting the server

### Planned

- Admin UI for creating, editing, and deleting events (currently events are populated by a seed script — see Architecture below)
- Backend persistence for profile updates (`PUT /api/auth/me`)
- Volunteer assignment management and per-event sign-up tracking
- Real SMTP wiring for production (SendGrid / Gmail / etc.) — currently emails log to the server console in dev mode
- Messaging, Calendar, and "My Events" pages (sidebar entries are commented out until the pages exist)
- Profile photo upload (the header avatar already reads `user.photoUrl` and falls back to a silhouette)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML / CSS / vanilla JS (no framework yet) |
| Backend | Node.js / Express |
| Database | MySQL 8 |
| Authentication | JWT (stored in `localStorage`), bcrypt password hashing |
| Email | nodemailer (console-mode in dev; SMTP-driven in production) |
| Static serving | Express `express.static` (frontend served from the Node process) |
| Hosting | TBD |

---

## Architecture: how events flow through the system

This is the model we want the rest of the app to follow as it grows.

1. The `events` table in MySQL is the **single source of truth** for what shows up on the landing page.
2. `server/scripts/seed-events.js` populates the table with the six demo events. It exists *only* until the admin side is built — when it's built, an admin form will INSERT into this same table and the seed script becomes obsolete.
3. `GET /api/events` (in `server/src/routes/events.js`) reads the table and returns the rows as JSON.
4. The landing page (`frontend/csus-landing-page-events.html`) calls that endpoint on load and renders one card per row.

The important property: **adding admin functionality later won't require changes to the GET endpoint or the frontend**. Only the *writer* of the table changes (seed script → admin UI). This same pattern can be applied to other features as they're built.

---

## Getting Started

### Prerequisites

- Node.js v18 or newer
- npm
- MySQL 8.0+
- Git

> **A note on shells:** the steps below show two columns of commands for the steps that differ between operating systems. Use the **macOS / Linux** column if you're on a Mac (Terminal) or Linux. Use the **Windows** column if you're on Windows (Command Prompt or PowerShell). If you're on Windows but using **Git Bash** or **WSL**, follow the macOS / Linux column instead — those shells understand Unix commands like `cp`.

### Setup

1. Clone the repository and enter it (same on every OS):

   ```
   git clone https://github.com/Khalid22333/volunteer-coordination-portal.git
   cd volunteer-coordination-portal
   ```

2. Initialize the database (from the repo root). The same command works on every OS — make sure the `mysql` CLI is on your `PATH` first (on Windows you may need to add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to your `PATH`, or run the command from the MySQL Command Line Client):

   ```
   mysql -u root -p < server/schema.sql
   ```

   This creates the `career_center` database with the `users` and `events` tables. The script uses `IF NOT EXISTS`, so it's safe to re-run.

   **Already have a `career_center` database from before these features shipped?** Apply the migrations in order to bring it up to date instead of recreating the database:

   ```
   mysql -u root -p career_center < server/migrations/001_add_email_verification.sql
   mysql -u root -p career_center < server/migrations/002_add_password_reset.sql
   ```

   `001` adds the email-verification columns and grandfathers existing rows in as already-verified, so people who signed up before that feature don't get locked out. `002` adds the password-reset columns. Both are one-shot — re-running will error on duplicate columns. New installs running `schema.sql` get all of these columns automatically.

3. Configure backend environment variables. First move into the server directory (same on every OS):

   ```
   cd server
   ```

   Then copy `.env.example` to `.env`:

   **macOS / Linux (Terminal, bash, zsh, Git Bash, WSL):**

   ```
   cp .env.example .env
   ```

   **Windows (Command Prompt):**

   ```
   copy .env.example .env
   ```

   **Windows (PowerShell):**

   ```
   Copy-Item .env.example .env
   ```

   Open `.env` and fill in your MySQL password and a JWT secret. Generate a secret with one of the commands below:

   **macOS / Linux:**

   ```
   openssl rand -base64 48
   ```

   **Windows (PowerShell):**

   ```
   [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
   ```

   **Any OS (using Node, which you already have installed):**

   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```

4. Install backend dependencies (same on every OS — run from the `server/` directory):

   ```
   npm install
   ```

5. Seed the events table with the demo data (same on every OS):

   ```
   npm run seed
   ```

   This inserts the six demo events. Re-running it wipes and reinserts (so ids stay stable at 1–6).

6. Start the server (same on every OS):

   ```
   npm run dev
   ```

   Visit `http://localhost:3001/` — the landing page is served from Express, and the API lives at `/api/...` on the same origin.

### Troubleshooting

- **`'cp' is not recognized as an internal or external command` (Windows):** you're on Windows CMD/PowerShell but ran a Unix command. Use the `copy` (CMD) or `Copy-Item` (PowerShell) version shown in step 3 — or run the project from **Git Bash** or **WSL**, where `cp` works.
- **`'openssl' is not recognized…` (Windows):** OpenSSL isn't on your `PATH`. Use the PowerShell or Node alternative shown in step 3 instead.
- **`'mysql' is not recognized…`:** the MySQL CLI isn't on your `PATH`. On Windows, either add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to your `PATH` or run the command from the MySQL Command Line Client shortcut. On macOS, if you installed MySQL via Homebrew it should already be on your `PATH`; otherwise add `/usr/local/mysql/bin` to your shell profile.
- **Port 3001 already in use:** another process is listening on the port. Stop it, or change `PORT` in `server/.env`.

### Email verification in development

By default the server runs in **console mode**: verification emails aren't actually sent — the recipient, subject, and verification link are printed in a banner in the server terminal. To finish a sign-up locally, copy the printed link and paste it into your browser. You'll see `[email] CONSOLE mode — verification emails will be printed here, not sent.` at startup confirming this.

To switch to real SMTP (e.g. for staging or production), add these to `server/.env` and restart:

```
SMTP_HOST=smtp.sendgrid.net          # or smtp.gmail.com, etc.
SMTP_PORT=587
SMTP_USER=apikey                     # SendGrid uses literal "apikey"; Gmail uses your address
SMTP_PASS=<your-key-or-app-password>
MAIL_FROM="CSUS Career Center <noreply@your-domain.example>"
PUBLIC_BASE_URL=https://your-deployed-host.example
```

`PUBLIC_BASE_URL` is the public URL the verification link should point at; it defaults to `http://localhost:3001` if unset.

### Design preview (no server required)

Any frontend HTML file can be opened directly from the filesystem (e.g. by double-clicking it) for styling work. In that mode, `auth.js` detects the `file://` protocol and skips auth guards so pages render without redirecting to login. The events grid will be empty in this mode because there's no API to fetch from.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/api/health`                      | —      | Health check; confirms the server is running. |
| POST   | `/api/auth/signup`                 | —      | Create a new user account. Validates email format and verifies the domain has DNS records that accept mail. Issues a verification token and triggers the verification email. Returns `{ user, token }` with `user.email_verified === false`. |
| POST   | `/api/auth/login`                  | —      | Log in. Returns `{ user, token }` including `user.email_verified`. |
| GET    | `/api/auth/me`                     | Bearer | Return the currently authenticated user, including `email_verified`. |
| GET    | `/api/auth/verify-email?token=…`   | —      | Validate a verification token and mark the corresponding account verified. Returns `{ ok: true, email }` on success, or an error if the token is missing/invalid/expired. Idempotent: hitting it twice returns `{ ok: true, alreadyVerified: true }`. |
| POST   | `/api/auth/resend-verification`    | Bearer | Issue a fresh verification token for the calling user and re-send the email. |
| POST   | `/api/auth/forgot-password`        | —      | Begin a password reset. Body: `{ email }`. Always returns `{ ok: true }` whether or not the email matches an account, so the endpoint can't be used to enumerate registered emails. If the email matches, a 1-hour reset token is issued and emailed (or console-logged in dev). |
| POST   | `/api/auth/reset-password`         | —      | Complete a password reset. Body: `{ token, password }`. On success returns `{ ok: true }`, sets the new password, marks the account verified, and invalidates the token. Errors with `expired` / `invalid` if the token is no longer usable. |
| GET    | `/api/events`                      | —      | List all events. Returns `{ events: [...] }`. |

---

## Repository Layout

```
volunteer-coordination-portal/
├── frontend/                       # static HTML/CSS/JS (served by Express)
│   ├── csus-landing-page-events.html
│   ├── login.html
│   ├── create-account.html         # signup + post-signup "check your email" panel
│   ├── verify-email.html           # landing page the verification link points at
│   ├── forgot-password.html        # email-entry form that kicks off a password reset
│   ├── reset-password.html         # landing page the reset link points at
│   ├── profile-creating.html
│   ├── auth.js                     # shared helpers (isLoggedIn, isEmailVerified, requireLogin, refreshUser, …)
│   └── assets/
└── server/
    ├── schema.sql                  # creates the career_center DB + users + events tables
    ├── migrations/
    │   ├── 001_add_email_verification.sql   # one-shot migration: adds verification columns
    │   └── 002_add_password_reset.sql       # one-shot migration: adds password-reset columns
    ├── scripts/
    │   └── seed-events.js          # populates the events table (npm run seed)
    └── src/
        ├── index.js                # Express bootstrap, mounts API routes + static files
        ├── db.js                   # mysql2/promise pool
        ├── email.js                # nodemailer wrapper (console mode in dev, SMTP in prod)
        └── routes/
            ├── auth.js             # signup / login / me / verify-email / resend-verification / forgot-password / reset-password
            └── events.js
```

---

## Project Management

| Tool | Link |
|------|------|
| Jira Board | https://id.atlassian.com/invite/p/project?id=khbl43xLQVOyO-y9YFd4TQ |
| Figma Prototype | https://www.figma.com/files/team/1573883061447164292/project/502847540?fuid=1616317088674264120 |
| GitHub Repo | https://github.com/Khalid22333/volunteer-coordination-portal |

---

## License

Last updated: Spring 2026


test change for Github setup
