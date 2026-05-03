# CLAUDE.md — fitted.

This file is read at the start of every Claude Code session in this repo. Keep it lean — anything that doesn't apply to *every* turn belongs in `.claude/rules/` or in skills, not here.

## What fitted is

AI resume tailoring and career app. Live at **www.getfittedcareers.com** (canonical; apex `getfittedcareers.com`, `get-fitted.vercel.app`, and deployment URLs all 308 redirect here). Sole founder/dev: Catalina Davis.

## Stack

- **Frontend**: Next.js (App Router), TypeScript, deployed on Vercel
- **Backend**: Supabase (Postgres + Auth + RLS), Edge Functions where needed
- **Payments**: Stripe SDK v22.x, API version `'2026-03-25.dahlia'`
- **AI**: claude-haiku-4-5-20251001 (free tier chat), claude-sonnet-4-20250514 (Pro tailor + standout features)
- **Local path**: `/Users/catalinalittle/Documents/fitted`
- **Repo**: `github.com/catalinasdavis/fitted-app`

## Pricing

- Free: 1 active resume
- Pro: $9/mo or $89/yr — unlimited resumes
- Resume slot: $4.99 one-time, +1 permanent slot, survives plan changes
- SLED/institutional: flat-rate + batch promo codes (NOT per-seat Stripe billing)

## Resume limit hierarchy (apply in this order)

1. Pro plan → unlimited
2. `extra_resume_slot` flag → +1 (permanent, regardless of current plan)
3. Free plan → 1

## Output format — hard rules

1. **Label every response** as `TERMINAL`, `NOT TERMINAL`, or `MIXED` on the first line, no preamble.
2. **All file writes use heredoc**: `cat > path << 'ENDOFFILE' ... ENDOFFILE`. Single-quoted delimiter, flush-left close.
3. **Full-file rewrites** — no `sed`/`awk` patches, no node script mutations, no diff hunks. Files >500 lines with localized changes: ask first.
4. **Two terminals**: `STRIPE` (CLI listener, webhook testing) and `DEV` (everything else). Label every shell block with which terminal it belongs in.

## Working style

- Quality over speed. Push back on rushed iterations.
- Don't default to agreeing. If a proposal is bad, say so with reasoning.
- Flag uncertainty honestly. Confidence calibration over confident-sounding fabrication.
- Don't claim "hundreds of professionals use fitted" until that's true.

## Don'ts

- Never use `as any` to bypass Stripe SDK v22 type errors. The correct types live on `subscription.items.data[0]`, not the subscription itself.
- Never tell me a task is done without running the verify-claims check.
- Never use `--dangerously-skip-permissions` for Stripe-related work.
- Never edit `.env.local` or anything in `node_modules` without flagging it explicitly.
