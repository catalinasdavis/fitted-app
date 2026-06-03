-- Unique constraint on (user_id, job_id) in the tracker table.
--
-- Required for the upsert in /api/tracker (POST) — without a unique constraint
-- PostgREST's resolution=merge-duplicates header has nothing to resolve against
-- and will INSERT a duplicate row instead of updating the existing one.
--
-- Apply via Supabase dashboard → SQL Editor, or `supabase db push`.

ALTER TABLE tracker
  ADD CONSTRAINT tracker_user_job_unique UNIQUE (user_id, job_id);
