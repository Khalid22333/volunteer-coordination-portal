-- Career Center Portal — database schema
-- Run once before starting the server:
--   mysql -u root -p < server/schema.sql
--
-- Safe to re-run; uses IF NOT EXISTS so it won't clobber existing data.

CREATE DATABASE IF NOT EXISTS career_center;
USE career_center;

CREATE TABLE IF NOT EXISTS users (
  id                              INT AUTO_INCREMENT PRIMARY KEY,
  name                            VARCHAR(100) NOT NULL,
  email                           VARCHAR(255) NOT NULL UNIQUE,
  password_hash                   VARCHAR(255) NOT NULL,
  -- Email verification. New rows start unverified; the /verify-email
  -- endpoint flips this to true once the user clicks their email link.
  -- Token columns are nullable because they're cleared after use.
  email_verified                  BOOLEAN     NOT NULL DEFAULT FALSE,
  verification_token              VARCHAR(64) NULL,
  verification_token_expires_at   DATETIME    NULL,
  -- Password reset. Token columns are nullable because they're cleared
  -- after use (or after expiry, lazily). A user has at most one active
  -- reset token at a time — issuing a new one overwrites the previous.
  password_reset_token            VARCHAR(64) NULL,
  password_reset_token_expires_at DATETIME    NULL,
  created_at                      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
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