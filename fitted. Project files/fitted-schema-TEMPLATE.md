# fitted Supabase Schema

> **TEMPLATE — fill in the SQL definitions from your actual Supabase project.** Either paste table definitions from the Supabase Dashboard → Database → Schema, or run `pg_dump --schema-only` and paste relevant parts here. Once filled in, this is the source of truth for any schema-related Claude work.

## Tables

### `profiles`

User profile data, 1:1 with auth.users.

**Known columns** (from prior work, verify against actual schema):
- `about_me` (text)
- `location` (text)
- `pay_target` (numeric or text — verify)
- `portfolio_files` (jsonb or text[] — verify)
- `extra_resume_slot` (boolean) — when true, grants +1 resume slot permanently regardless of plan
- `plan` (text) — `'free' | 'pro_monthly' | 'pro_annual'` (verify exact values)

```sql
-- PASTE ACTUAL CREATE TABLE STATEMENT HERE
```

### `resumes`

User-uploaded resumes.

**Key behavior**: `is_active` is toggled **independently per row** — there is NO exclusive-active behavior. A user can have multiple active resumes at once (subject to the resume limit hierarchy in CLAUDE.md).

```sql
-- PASTE ACTUAL CREATE TABLE STATEMENT HERE
```

### `tracker`

Job application kanban board (replaced the old "Saved" tab).

**Key behavior**: Soft delete via `deleted_at` timestamp. Items in trash are kept for 14 days, then hard-deleted by a scheduled job (verify: cron schedule, edge function, or manual?).

```sql
-- PASTE ACTUAL CREATE TABLE STATEMENT HERE
```

### `promo_codes`

Promo code definitions.

**Key behavior**: 16 beta codes seeded. `CATALINA-VIP` is reusable (multiple redemptions allowed). Most codes are single-use.

```sql
-- PASTE ACTUAL CREATE TABLE STATEMENT HERE
```

## RLS policies

Document each table's RLS policies. Whenever a new policy is added or modified, update this section AND run the "Supabase RLS audit" prompt from the prompt library.

```sql
-- PASTE RLS POLICIES PER TABLE HERE
```

## Views, functions, triggers

```sql
-- PASTE ANY CUSTOM VIEWS, FUNCTIONS, OR TRIGGERS HERE
```

## Migrations

Migrations live at: [`supabase/migrations/` or wherever your migrations are tracked]

Last migration applied: [date]
