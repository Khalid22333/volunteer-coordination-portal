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