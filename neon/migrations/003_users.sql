-- ============================================================
-- RentenCheck+ — Migration 003: Users table
-- Adds persistent user accounts with cloud-synced settings.
-- Users are auto-created on first magic link login (upsert).
-- Run this in the Neon SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Users table — one row per unique email address
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  settings   JSONB DEFAULT NULL,           -- saved calculator inputs (PensionInput)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Trigger to auto-update updated_at on any change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger first to make migration idempotent
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

