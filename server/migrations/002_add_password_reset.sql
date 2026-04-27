-- Migration: add password-reset columns to existing users table.
-- Run this once on databases that were created BEFORE the forgot-password
-- feature shipped. New installs already get these columns from schema.sql.
--
-- Usage:
--   mysql -u root -p career_center < server/migrations/002_add_password_reset.sql
--
-- This file is NOT idempotent — running it twice will error on the second
-- run because the columns already exist. That's fine: it's a one-shot
-- migration.

USE career_center;

ALTER TABLE users
  ADD COLUMN password_reset_token            VARCHAR(64) NULL,
  ADD COLUMN password_reset_token_expires_at DATETIME    NULL;
