require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());              // allow the React frontend to call this API
app.use(express.json());      // parse JSON request bodies

// Root health check
app.get('/', (req, res) => {
  res.json({ message: 'Career Center Portal API is running' });
});

// Mount auth routes under /api/auth
app.use('/api/auth', authRoutes);

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