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

User profile data, 1:1 with `auth.users`.

```sql
create table profiles (
  id uuid primary key references auth.users not null,
  email text,
  plan text default 'free' check (plan in ('free', 'pro_monthly', 'pro_annual')),
  career_field text,
  career_stage text,
  priority text,
  about_me text,
  location text[],
  pay_target text,
  portfolio_files jsonb default '[]'::jsonb,
  extra_resume_slot boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'free' check (subscription_status in ('free', 'active', 'canceling', 'canceled', 'past_due')),
  cancel_at_period_end boolean default false,
  current_period_end timestamptz,
  discount_offers_used integer default 0,
  active_discount_tier integer,
  active_discount_expires_at timestamptz,
  onboarding_completed boolean default false,
  preferred_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

### `resumes`

User-uploaded resumes.

**Key behavior**: `is_active` is toggled **independently per row** — there is NO exclusive-active behavior. A user can have multiple active resumes at once (subject to the resume limit hierarchy in CLAUDE.md).

create table resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  resume_text text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

### `tracker`

Job application kanban board (replaced the old "Saved" tab).

**Key behavior**: Soft delete via `deleted_at` timestamp. Items in trash are kept for 14 days, then hard-deleted by a scheduled job (verify: cron schedule, edge function, or manual?).

create table tracker (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  job_id text not null,
  column_id text not null,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

### `promo_codes`

Promo code definitions.

**Key behavior**: 16 beta codes seeded. `CATALINA-VIP` is reusable (multiple redemptions allowed). Most codes are single-use.

create table promo_codes (
  code text primary key,
  is_reusable boolean default false,
  max_uses integer,
  used_count integer default 0,
  created_at timestamptz default now()
);

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
