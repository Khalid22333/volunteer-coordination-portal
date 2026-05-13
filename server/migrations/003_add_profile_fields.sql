-- Migration: add user-editable profile fields to the users table.
-- Run this once on databases that were created BEFORE the profile-edit
-- feature shipped. New installs already get these columns from schema.sql.
--
-- Usage:
--   mysql -u root -p career_center < server/migrations/003_add_profile_fields.sql
--
-- This file is NOT idempotent — running it twice will error on the second
-- run because the columns already exist. That's fine: it's a one-shot
-- migration. If you need to roll back, drop the columns manually.
--
-- Storage notes:
--   * phone        — free-form, accepts "(916) 555-0123", "+1 916-555-0123",
--                    etc. We validate format in the API layer, not the DB,
--                    so this stays a plain VARCHAR.
--   * major        — short text, e.g. "Computer Science" / "Biology B.S."
--   * bio          — free-form "about you" paragraph. TEXT (up to 65k) is
--                    overkill for what we'll actually accept, but the API
--                    layer enforces a 1000-char ceiling so the column never
--                    grows large in practice.
--   * skills       — comma-separated free text for now. Promotable to a
--                    separate user_skills join table later if we ever want
--                    to filter/match volunteers by skill server-side.
--   * availability — CSV of day codes from the set
--                    {mon,tue,wed,thu,fri,sat,sun}, in fixed weekday order.
--                    Max length is "mon,tue,wed,thu,fri,sat,sun" = 27 chars,
--                    so VARCHAR(50) is plenty of headroom. We could use SET
--                    here, but SET in MySQL has well-known footguns (numeric
--                    coercion, ordering surprises); a normalised CSV string
--                    is simpler and the API does the validation.

USE career_center;

ALTER TABLE users
  ADD COLUMN phone        VARCHAR(20)  NULL,
  ADD COLUMN major        VARCHAR(150) NULL,
  ADD COLUMN bio          TEXT         NULL,
  ADD COLUMN skills       TEXT         NULL,
  ADD COLUMN availability VARCHAR(50)  NULL;
