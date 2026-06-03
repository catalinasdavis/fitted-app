-- Add tier and notified_at columns to the waitlist table.
--
-- tier       — 'founding' | 'early' | 'standard', assigned at signup time.
--              Previously computed on-the-fly and thrown away; now persisted
--              so the launch email blast can look it up without re-deriving it.
--
-- notified_at — timestamp set when the launch email is successfully delivered.
--               NULL = not yet notified. Used as an idempotency cursor: the
--               send-launch-emails route skips any row where this is set,
--               so partial blasts can be safely retried.
--
-- Apply via Supabase dashboard → SQL Editor, or `supabase db push`.

ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS tier        TEXT,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- Backfill tier for existing rows based on signup order.
-- Assumes id is sequential (bigint serial or time-ordered UUID).
-- Verify the results in the dashboard before sending any emails.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM waitlist
)
UPDATE waitlist w
SET tier = CASE
  WHEN r.rn <= 100 THEN 'founding'
  WHEN r.rn <= 200 THEN 'early'
  ELSE               'standard'
END
FROM ranked r
WHERE w.id = r.id
  AND w.tier IS NULL;
