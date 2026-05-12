-- ============================================================
-- RentenCheck+ — Setup Script: Create dedicated database
-- ============================================================
-- Run this ONCE against the default 'neondb' database (or via the Neon Dashboard SQL Editor).
-- This creates a dedicated database so app data doesn't live in the default DB.
--
-- Connection: psql $DEFAULT_DATABASE_URL -f 001_create_database.sql
-- Or: paste into Neon Dashboard → SQL Editor (connected to neondb)
-- ============================================================

-- Create the dedicated database (using template0 to allow custom collation)
CREATE DATABASE rentencheck
  WITH TEMPLATE = template0
       ENCODING = 'UTF8'
       LC_COLLATE = 'C.UTF-8'
       LC_CTYPE = 'C.UTF-8';

-- Verify
-- \l rentencheck


