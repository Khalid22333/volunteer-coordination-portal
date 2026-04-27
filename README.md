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
- Auth-aware navigation: protected actions (e.g. "Apply" on an event) prompt for login and bounce the user back where they were after sign-in
- Public landing page with upcoming events, served from the database
- Profile customization page styled to match the landing page (form fields wired up; backend save still in progress)
- Single-origin deployment: Express serves both the API and the static frontend at `http://localhost:3001/`
- Design-preview mode: pages opened directly via `file://` skip the auth guards, so the team can iterate on styling without booting the server

### Planned

- Admin UI for creating, editing, and deleting events (currently events are populated by a seed script — see Architecture below)
- Backend persistence for profile updates (`PUT /api/auth/me`)
- Volunteer assignment management and per-event sign-up tracking
- Email confirmation after sign-up (NodeMailer)
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

### Setup

1. Clone the repository and enter it:

   ```
   git clone https://github.com/Khalid22333/volunteer-coordination-portal.git
   cd volunteer-coordination-portal
   ```

2. Initialize the database (from the repo root):

   ```
   mysql -u root -p < server/schema.sql
   ```

   This creates the `career_center` database with the `users` and `events` tables. The script uses `IF NOT EXISTS`, so it's safe to re-run.

3. Configure backend environment variables:

   ```
   cd server
   cp .env.example .env
   ```

   Open `.env` and fill in your MySQL password and a JWT secret. Generate a secret with:

   ```
   openssl rand -base64 48
   ```

4. Install backend dependencies:

   ```
   npm install
   ```

5. Seed the events table with the demo data:

   ```
   npm run seed
   ```

   This inserts the six demo events. Re-running it wipes and reinserts (so ids stay stable at 1–6).

6. Start the server:

   ```
   npm run dev
   ```

   Visit `http://localhost:3001/` — the landing page is served from Express, and the API lives at `/api/...` on the same origin.

### Design preview (no server required)

Any frontend HTML file can be opened directly from the filesystem (e.g. by double-clicking it) for styling work. In that mode, `auth.js` detects the `file://` protocol and skips auth guards so pages render without redirecting to login. The events grid will be empty in this mode because there's no API to fetch from.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/api/health`       | —      | Health check; confirms the server is running. |
| POST   | `/api/auth/signup`  | —      | Create a new user account. Returns `{ user, token }`. |
| POST   | `/api/auth/login`   | —      | Log in. Returns `{ user, token }`. |
| GET    | `/api/auth/me`      | Bearer | Return the currently authenticated user. |
| GET    | `/api/events`       | —      | List all events. Returns `{ events: [...] }`. |

---

## Repository Layout

```
volunteer-coordination-portal/
├── frontend/                       # static HTML/CSS/JS (served by Express)
│   ├── csus-landing-page-events.html
│   ├── login.html
│   ├── create-account.html
│   ├── profile-creating.html
│   ├── auth.js                     # shared login-state helpers (isLoggedIn, requireLogin, logout, …)
│   └── assets/
└── server/
    ├── schema.sql                  # creates the career_center DB + users + events tables
    ├── scripts/
    │   └── seed-events.js          # populates the events table (npm run seed)
    └── src/
        ├── index.js                # Express bootstrap, mounts API routes + static files
        ├── db.js                   # mysql2/promise pool
        └── routes/
            ├── auth.js
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
