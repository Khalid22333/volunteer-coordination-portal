# volunteer-coordination-portal
Career Center Volunteer Coordination Portal - CSC 131 Group 9
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
| Dylan Hulett | 
| Jayden Brown | 
| Manjot Dhaliwal | 
| Khalid Abid | 
| Anna Kubrak | 

---
## Features

### Volunteer Features
- Account registration and login
- Browse upcoming Career Center events
- Sign up for volunteer roles/shifts
- Email confirmation after sign-up
- Personal volunteer schedule calendar

### Admin Features
- Create, edit, and delete events
- View volunteers signed up per event
- Manage and verify volunteer assignments

---
## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Node.js / Express |
| Database | SQL (PostgreSQL or MySQL) |
| Authentication | Session-based / JWT |
| Email Notifications | NodeMailer |
| Hosting | TBD |

---
## Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- MySQL 8.0+
- Git

### Backend Setup

1. Clone the repository and enter it:

   ```
   git clone https://github.com/Khalid22333/volunteer-coordination-portal.git
   cd volunteer-coordination-portal
   ```

2. Initialize the database (from the repo root):

   ```
   mysql -u root -p < server/schema.sql
   ```

   This creates the `career_center` database and `users` table. Safe to re-run.

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

5. Start the development server:

   ```
   npm run dev
   ```

   The API runs at http://localhost:3001.

### API Endpoints

- `POST /api/auth/signup` — create a new user account
- `POST /api/auth/login` — log in with email and password
- `GET /api/auth/me` — get the current user (requires `Authorization: Bearer <token>` header)

### Frontend Setup

_Coming soon — React client will live in a `/client` folder._

---
## Project Management

| Tool | Link |
|------|------|
| Jira Board |https://sacstatevolunteering.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog?atlOrigin=eyJpIjoiMjBiNjVkMzc3MDliNDA0YTliOTc5NmYxYjFiMDUyYmUiLCJwIjoiaiJ9|
| Figma Prototype |https://www.figma.com/files/team/1573883061447164292/project/502847540?fuid=1616317088674264120 |
| GitHub Repo |https://github.com/Khalid22333/volunteer-coordination-portal |
UPDATED JIRA LINK: https://id.atlassian.com/invite/p/project?id=khbl43xLQVOyO-y9YFd4TQ
---

## License
Last updated: Spring 2026


test change for Github setup

