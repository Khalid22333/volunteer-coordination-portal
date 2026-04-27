require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');

const app = express();

// Middleware
app.use(cors());              // allow the React frontend to call this API
app.use(express.json());      // parse JSON request bodies

// Serve the static frontend (HTML/CSS/JS) from /frontend.
// This lets the whole app run from one origin (http://localhost:3001),
// so the relative fetch('/api/auth/login') calls work without CORS hassles.
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// Visiting the root sends you to the landing page.
app.get('/', (req, res) => {
  res.redirect('/csus-landing-page-events.html');
});

// API health check (handy for confirming the server is up without
// hitting the database).
app.get('/api/health', (req, res) => {
  res.json({ message: 'Career Center Portal API is running' });
});

// Mount auth routes under /api/auth
app.use('/api/auth', authRoutes);

// Mount events routes under /api/events (read-only for now; admin CRUD later)
app.use('/api/events', eventsRoutes);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Verify MySQL is reachable before we accept requests
    const conn = await db.getConnection();
    console.log('Connected to MySQL database');
    conn.release();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();