-- ============================================================
-- RentenCheck+ — Setup Script: Create application user
-- ============================================================
-- Run this ONCE against the 'rentencheck' database as the owner/admin role.
-- This creates a least-privilege app user for the Netlify Functions.
--
-- Connection: psql $ADMIN_DATABASE_URL -f 002_create_app_user.sql
-- Or: paste into Neon Dashboard → SQL Editor (connected to rentencheck)
--
-- IMPORTANT: Replace 'CHANGE_ME_STRONG_PASSWORD' with a real generated password.
-- Use: openssl rand -base64 32
-- ============================================================

-- 1. Create the app role (login-capable, no superuser, no createdb)
CREATE ROLE rentencheck_app WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

-- 2. Grant connect to the rentencheck database
GRANT CONNECT ON DATABASE rentencheck TO rentencheck_app;

-- 3. Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO rentencheck_app;

-- 4. Grant DML privileges on ALL existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rentencheck_app;

-- 5. Grant usage on sequences (for DEFAULT gen_random_uuid() etc.)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rentencheck_app;

-- 6. Grant execute on functions (cleanup_expired_tokens, triggers)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO rentencheck_app;

-- 7. Make future tables/sequences also accessible (if schema changes are applied by admin)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rentencheck_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO rentencheck_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO rentencheck_app;

-- ============================================================
-- After running this script, your DATABASE_URL for Netlify should be:
--
--   postgresql://rentencheck_app:<PASSWORD>@<NEON_HOST>/rentencheck?sslmode=require
--
-- Set this as the DATABASE_URL environment variable in Netlify.
-- ============================================================

