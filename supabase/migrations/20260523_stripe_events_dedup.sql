-- Webhook deduplication table for Stripe events.
--
-- The webhook handler inserts the event_id (primary key) before processing.
-- A retried or replayed delivery hits the unique constraint (error 23505) and
-- is returned 200 immediately without re-running any profile writes.
--
-- Rows older than 7 days are purged lazily in the webhook handler itself.
-- Stripe's maximum retry window is ~72 hours, so 7 days is a safe margin.
--
-- Apply via Supabase dashboard → SQL Editor, or `supabase db push`.

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id     TEXT        PRIMARY KEY,
  event_type   TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- No policies needed — accessed exclusively via the service role key from the
-- webhook handler. The service role bypasses RLS.
