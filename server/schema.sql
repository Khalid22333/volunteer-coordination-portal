-- Career Center Portal — database schema
-- Run once before starting the server:
--   mysql -u root -p < server/schema.sql
--
-- Safe to re-run; uses IF NOT EXISTS so it won't clobber existing data.

CREATE DATABASE IF NOT EXISTS career_center;
USE career_center;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer events / open positions.
-- In production these would be created/edited by Career Center staff via an
-- admin UI. For now, populate with `npm run seed` (see server/scripts/seed-events.js).
-- The column names mirror the shape of the event objects the frontend
-- already renders, so the API can pass rows through with minimal mapping.
CREATE TABLE IF NOT EXISTS events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  month       VARCHAR(20)  NOT NULL,   -- e.g. "Feb", "April", "MAY"
  day         INT          NOT NULL,   -- e.g. 10, 23
  time_range  VARCHAR(50)  NOT NULL,   -- e.g. "2:00pm - 5:00pm"
  image       VARCHAR(500),            -- relative path under frontend/assets/
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);