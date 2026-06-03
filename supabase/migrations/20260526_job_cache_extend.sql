-- Extend job_cache with an explicit expires_at column.
--
-- The table already exists with (field, country) composite PK.
-- Previously, TTL was checked in application code against fetched_at.
-- This migration moves expiry to the DB so PostgREST can filter stale
-- rows at query time and the TTL is self-documenting on each row.
--
-- TTL is extended from 24 hours to 7 days.
-- Stripe's max retry window is 72h; we use 7 days for job listings
-- since openings typically stay live for at least that long.
--
-- Apply via Supabase dashboard → SQL Editor, or `supabase db push`.

ALTER TABLE job_cache
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill existing rows with a 7-day window from their fetch time.
UPDATE job_cache
  SET expires_at = fetched_at + INTERVAL '7 days'
  WHERE expires_at IS NULL;
