-- Migration: add email verification columns to existing users table.
-- Run this once on databases that were created BEFORE the email-verification
-- feature shipped. New installs already get these columns from schema.sql.
--
-- Usage:
--   mysql -u root -p career_center < server/migrations/001_add_email_verification.sql
--
-- This file is NOT idempotent — running it twice will error on the second
-- run because the columns already exist. That's fine: it's a one-shot
-- migration. If you want to re-run it for some reason, drop the columns
-- first or remove the ALTER lines that already applied.
--
-- Existing rows are marked email_verified = TRUE so we don't lock out
-- accounts that pre-date this feature. New signups go through the normal
-- "verify before applying" flow.

USE career_center;

ALTER TABLE users
  ADD COLUMN email_verified                BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN verification_token            VARCHAR(64) NULL,
  ADD COLUMN verification_token_expires_at DATETIME    NULL;

-- Grandfather in any pre-existing accounts so they don't suddenly need
-- to verify an email they signed up with months ago.
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;
