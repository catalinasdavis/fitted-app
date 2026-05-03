# Catalina's Prompt Library

Reusable prompts for working with Claude on fitted. and beyond. Copy-paste as-is, adapt the bracketed bits.

Organized by *when* you'd reach for them, not by topic.

---

## Standing instructions (paste once at the start of a session)

### Push-back permission
> From now on: when I propose something you think is a bad idea, say so directly with your reasoning. Don't soften, don't "help me think it through" — give me your honest take first, then we can discuss. I'd rather hear "this is the wrong move because X" than have you go along with it.

---

## Before a task — scope it before you spend tokens

### Plan Mode in plain text
For claude.ai chats (no built-in Plan Mode) or when you want a written plan to reference.

> Before writing any code, list: (1) every file you'll touch, (2) what you'll change in each, (3) what you'll NOT touch but might be tempted to, (4) the riskiest part of the change, (5) what you're uncertain about and need me to confirm. Wait for my approval before proceeding.

### Steel-man before committing
> Here's what I'm planning: [X]. Steel-man the strongest argument AGAINST this approach. What am I likely missing? What would break this in 3 months? Then tell me whether you still think it's the right call.

### Challenge me
> I think [X] is the right move. Don't agree by default. Argue the opposite case as if you genuinely believed it. What would I have to be wrong about for the opposite to be correct?

---

## During a task — keep Claude on rails

### Reproduce-first
Use the moment a bug is reported.

> Before suggesting a fix, write a minimal reproduction. Show me the exact steps and expected vs actual output. If you can't reproduce it, say so explicitly — don't guess.

### Decorate-and-run
When Claude is stuck on a bug and starting to fabricate causes.

> Don't guess at the cause. Add detailed file logs at every variable mutation and branch in [function or file]. Run the failing case. Show me the actual log output. Then diagnose from real data, not assumptions.

### Stop and ask
When the task is getting bigger than expected.

> Pause. Before going further, list: what you've completed, what's left, and any decisions you made along the way that I haven't explicitly approved. I'll respond before you continue.

---

## After a task — verify before you trust

### Verify-every-claim table
The single highest-ROI prompt in this library.

> Make a table with three columns: Claim, Status (Verified / Inferred), Evidence. List every claim you made and every change you made. For each Inferred row, run a test or check now and update the status. Don't tell me you're done until every row is Verified.

### Senior engineer review
> Review this change as a senior engineer who's seen similar code break in production. Specifically check: error handling completeness, edge cases not tested, race conditions, security implications, and any "this works on the happy path but..." vulnerabilities. Be specific — name the lines or functions, don't give me generalities.

### Teach me what I just shipped
After Claude builds something complex you'll have to maintain.

> Pretend I have to maintain this code without you. Teach me: what each new file does, the data flow, the failure modes, and the one thing most likely to surprise future-me when I look at this in 6 months.

### Pre-deploy checklist
Before pushing to main or letting Vercel deploy.

> List a deploy-readiness checklist for this specific change. Include: tests run? env vars updated in Vercel? migrations applied? RLS policies verified? rollback plan? Anything I'd kick myself for forgetting. Make it specific to what we changed today, not generic.

### Commit + changelog + update
> Generate three things: (1) a conventional-commits-style commit message for everything we just did, (2) a one-line CHANGELOG entry, (3) a 2–3 sentence Slack-style update if I were sharing this with a collaborator. Plain text, no markdown styling.

---

## fitted-specific

### Stripe webhook signature debugger
> My Stripe webhook is failing signature verification locally. Walk me through, in this order: (1) where the signing secret should come from in dev vs prod (Stripe CLI listener vs Stripe Dashboard), (2) the raw-body vs parsed-body distinction in Next.js API routes, (3) the 5 most common reasons signatures fail, ranked by how often they're the cause. Then ask me what I'm actually seeing before suggesting a fix.

### Supabase RLS audit
> Audit RLS for the [table_name] table. List: every policy currently active, what each one allows or blocks, whether SUPABASE_SERVICE_ROLE_KEY is required for any of my server endpoints that touch this table, and any policy gaps that would let an authenticated user read or modify data they shouldn't.

### Design self-critique
> Critique this UI as a senior product designer reviewing a portfolio piece. Hierarchy clarity, alignment, spacing rhythm, type pairing, contrast, and any choices that feel "AI-generic" rather than intentional. Be specific — name the elements you're criticizing. Suggest two concrete changes.

### Steal-this-pattern audit
> I'm looking at [competitor URL or screenshot]. Without copying anything copyrighted, identify: (1) patterns I should consider stealing, (2) patterns that work for them but wouldn't fit fitted's tone, (3) patterns that look effective but are actually mediocre — where fitted could do better.

---

## Meta-prompts (rarely needed, high value when they are)

### What would change your mind
> What evidence would make you change your conclusion here? If I told you [counter-evidence], would you update? If not, why not?

### Confidence calibration
> Rate your confidence in what you just said on a 1–5 scale. Anything below a 4: tell me what you'd need to verify to make it a 5, and verify it now if you can.
