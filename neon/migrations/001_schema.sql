-- ============================================================
-- RentenCheck+ — Neon Postgres Schema
-- Run this in the Neon SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Purchases table — source of truth for all payments
CREATE TABLE IF NOT EXISTS purchases (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT NOT NULL,
  stripe_session_id    TEXT UNIQUE NOT NULL,
  stripe_customer_id   TEXT,
  stripe_payment_intent TEXT,
  tier                 TEXT NOT NULL CHECK (tier IN ('report', 'premium')),
  amount               INTEGER NOT NULL,          -- in cents (e.g. 1490 = €14.90)
  currency             TEXT NOT NULL DEFAULT 'eur',
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'paid', 'refunded', 'disputed')),
  pension_input        JSONB,                     -- stored calculator inputs for re-generation
  download_token       UUID DEFAULT NULL,          -- server-verified PDF access token
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at              TIMESTAMPTZ,
  refunded_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(email);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_download_token
  ON purchases(download_token) WHERE download_token IS NOT NULL;

-- 2. Magic link tokens — for passwordless authentication
CREATE TABLE IF NOT EXISTS magic_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,               -- NULL = not used yet
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);

-- 3. Sessions — authenticated user sessions
CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL,       -- HMAC-signed session token
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- 4. Cleanup function — removes expired magic links and sessions.
--    Call periodically via pg_cron, Netlify scheduled function, or manual cron.
--    Example pg_cron: SELECT cron.schedule('cleanup-expired', '0 3 * * *', $$SELECT cleanup_expired_tokens()$$);
CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS void AS $$
BEGIN
  DELETE FROM magic_links WHERE expires_at < now();
  DELETE FROM sessions    WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;


