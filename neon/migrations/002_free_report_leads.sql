-- Free report email leads — captures email addresses from free PDF delivery.
-- Used for lead generation: free users enter email to receive their report summary.

CREATE TABLE IF NOT EXISTS free_report_leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL,
  score         INT         NOT NULL,
  grade         VARCHAR(2)  NOT NULL,
  rentenluecke  NUMERIC(12,2),
  deckungsquote NUMERIC(5,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for rate-limiting queries (max N emails per hour per address)
CREATE INDEX IF NOT EXISTS idx_free_report_leads_email_created
  ON free_report_leads (email, created_at DESC);

-- Cleanup: delete leads older than 90 days (GDPR data minimization)
-- Can be called by the existing cleanup-expired scheduled function.

