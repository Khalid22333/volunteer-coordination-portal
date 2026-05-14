// routes/events.js
//
// Read-only events API. The frontend landing page calls GET /api/events on
// load and renders one card per row.
//
// We map the snake_case `time_range` column to camelCase `timeRange` in the
// response so the frontend can use the row object directly without an
// intermediate transform — same shape it already expects from the (now
// retired) hardcoded array.
//
// When admin CRUD lands later, POST/PUT/DELETE handlers go in this same
// file. The GET handler below is the read side of that future API and
// shouldn't need to change.

const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/events — returns all events, oldest-id first.
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, month, day, time_range AS timeRange, image FROM events ORDER BY id'
    );
    res.json({ events: rows });
  } catch (err) {
    console.error('Events fetch error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
