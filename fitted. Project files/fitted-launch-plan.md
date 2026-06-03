# fitted Launch Plan

**Founder**: Catalina Davis  
**Target Launch Date**: Sunday, June 14, 2026  (exactly one year after I graduated from the University of Washington)
**Buffer Launch Date**: Saturday, June 20, 2026 (only if quality demands it)  
**Domain**: www.getfittedcareers.com  
**Repo**: github.com/catalinasdavis/fitted-app  
**Local Path**: /Users/catalinalittle/Documents/fitted  
**Hosting**: Vercel (Production)  
**Database**: Supabase (Postgres + Auth + RLS)  
**Payments**: Stripe SDK v22 (API version 2026-03-25.dahlia)

**Last updated**: June 1, 2026  
**Current phase**: Final sprint — 13 days to launch. No work May 30–31. Functional core is solid; design system and visual polish are the primary gap.

---

## Positioning

**fitted.** is for **women aged 22–35** — early career, career changers, and returners — who want work that actually fits their life and values.

This is not a generic job board. It's a career companion built for the specific reality of women navigating an unequal job market: negotiating for what they're worth, pivoting after a break, finding roles that don't demand they sacrifice everything else.

Every product decision filters through: *Would a 27-year-old woman re-entering the workforce after two years away feel genuinely helped — or just processed?*

---

## Overview & Philosophy

We are building **fitted.** — a warm, intelligent career platform with a quiet-luxury, editorial aesthetic. Every decision is measured against four lenses:

1. **Product** — Would a user in the middle of a stressful job search actually feel helped?
2. **Code quality** — Would a strong engineer reviewing this later cringe?
3. **Investor-readiness** — Does this hold up to someone who might one day acquire, fund, or partner with us?
4. **User experience** — Does this treat job seekers like intelligent adults who deserve real guidance?

**Test for everything**: "Would I be proud to show this to someone I respect?"

---

## Monetization & Pricing Model (v1)

**Tiers**

- **Pro** — $9/month or $90/year (2 months free)
  - 30 AI Actions per month
  - All core Pro features
  - Ability to buy additional AI Action packs

- **Premium** — $18/month or $180/year (2 months free)
  - Unlimited AI Actions
  - Priority access + all Pro features

**AI Actions System**
- We no longer show raw token counts to users
- All AI features (search, resume optimization, health score, Ask Fitted., coach nudges, interview prep, etc.) consume from a unified "AI Actions" pool
- Pro users get 30 AI Actions per month
- Users can buy extra Action packs if they run out
- In Account settings, users can toggle on/off auto-generation for:
  - Match Insights on job detail
  - Tailor My Resume suggestions
  - Help Me Stand Out
  - fitted. thinks insights

**Buy More Packs (for Pro users)**

Pack | Actions | Price
--- | --- | ---
Small | 10 Actions | $5
Medium | 25 Actions | $12 *(most popular)*
Large | 60 Actions | $25

---

## AI Model Usage Strategy (Haiku vs Sonnet)

To balance cost and quality, we use two Claude models strategically:

| Feature | Model | Reason |
|---|---|---|
| Natural Language Search | Haiku | Fast, frequent, good enough |
| Basic Match Scoring | Haiku | Very frequent calls |
| Resume Health Score | Haiku | Frequent |
| Personal Coach Nudges & Summaries | Haiku | Short & frequent |
| Per-Job Resume Optimization | **Sonnet** | High value, needs quality |
| Ask Fitted. Chat | Sonnet (first 2 turns) → Haiku | Quality conversation starter |
| Interview Prep Generator | **Sonnet** | Needs to be smart |
| Salary Negotiation Scripts | **Sonnet** | High stakes |
| Career Path Simulator | **Sonnet** | Complex reasoning |

**Rule of thumb**: Use **Sonnet** for deep coaching / high-stakes outputs. Use **Haiku** for everything else to protect margins.

---

## 22-Day Launch Sprint

> **⚠️ Claude Design Usage Block — May 23–29**
> Claude Design usage is exhausted until **May 30**. The latest design files cannot be downloaded until then. **Do not start major visual redesign integration before May 30** — any work done now would need to be redone once the new design system is available. Use May 26–29 for functional stability, security hardening, and non-visual polish only.

### Friday, May 22 (Today) — 6+ hours ✅ Complete
- Update Claude Code with new positioning + demographic focus ✅
- Set up Fantastic.jobs API (self-serve, free tier) ✅
- Create strong caching layer (24–48h cache) ✅
- Final polish on coming-soon → full landing page transition logic ✅

### Saturday, May 23 — Full day ✅ Complete
- Mobile responsiveness pass on landing page ✅
- Auth pages polish + sign-up → quiz → dashboard flow verified end-to-end ✅
- Dashboard first-run experience: welcome modal, demo persona chip, empty states ✅
- Full end-to-end new-user flow smoke test ✅

### Sunday, May 24 — Full day ✅ Complete
- Production console.log cleanup across all API routes ✅
- Stuck loading state fixes: `redeem()`, `savePr()`, `addTracker()` ✅
- Match tab loading state (null vs '' discrimination) ✅
- Job detail page: branded spinner loading state ✅
- Disliked view: removed duplicate Delete button ✅
- Welcome modal chip: shows real demo persona name ✅

### Monday, May 25 — Full day ✅ Complete
- AI Career Path tab: replaced hardcoded static nodes with AI-generated personalized roadmap ✅
- Static fallback nodes for Pro users when AI is unavailable ✅
- Critical Broken Code Audit: identified all stuck loading states and unhandled failures ✅
- Full try/catch/finally pass: `runOptimize`, `runExplore`, `runAnalysis`, cancel flow ✅
- Error boundaries: `app/error.tsx` and `app/global-error.tsx` (Next.js 16.2 `unstable_retry`) ✅
- Career path prompt improvements: field/stage label expansion, simplified JSON schema ✅

---

> **May 23–29 — Functional Stability Sprint (Claude Design blocked until May 30)**
> No major visual changes until May 30. Focus: backend stability, security hardening, reliability.

### Tuesday, May 26 — ✅ Complete
- `lib/rate-limit.ts`: dual IP + user-ID gates on all AI routes, Stripe endpoints, resume upload, and promo redeem ✅
- Promo code TOCTOU: atomic Supabase RPC `redeem_promo_code` with `SELECT ... FOR UPDATE` row lock; migration applied ✅
- Stripe webhook deduplication: `stripe_events` table with PK insert — replayed events return 200 without re-writing; migration applied ✅
- Security audit — 4 confirmed findings fixed (tracker upsert, restore PATCH filter, `discount_offers_used` optimistic locks in save-offer + cancel-subscription) ✅
- Stripe coupon IDs verified in dashboard; webhook edge case fixed (`cancel_at_period_end: false` on portal reactivation; `'cancelled'` → `'canceling'` status alignment) ✅
- Internal job cache layer: `job_cache` table extended with `expires_at` (7-day TTL); quality threshold (≥ 8 jobs scoring ≥ 55 before cache accepted); `?refresh=1` force-bypass; ↻ Refresh button in job feed UI; migration applied ✅

### Wednesday, May 27 — Partially complete
- Email notification backend built: `/api/admin/send-launch-emails` route, `waitlist` `tier` + `notified_at` columns, migration written ✅
- ⏳ **Blocked**: Resend DNS propagation delay (GoDaddy) — launch blast deferred to May 30
- Security pass (CSRF headers, `Secure` flag, RLS audit on `profiles`/`resumes`/`tracker`) — not started, carrying to May 30

### Thursday, May 28 — ✅ Complete (social media content focus)
- Social media content creation in Canva (primary focus all day) ✅
  - Created first Instagram Reel cover ("Your Story — fitted." format)
  - Built quote carousels and definition carousels for multiple content types
  - Refined SE (Something Educational) carousel format
  - Developed Vibe Templates for aesthetic consistency across the content calendar
  - Planned post-launch CTA adjustments for the June 7–13 window
- Mobile testing pass — not done, carrying to May 30
- Empty state audit — not done, carrying to May 30
- Copy pass — not done, carrying to May 30

### Friday, May 29 — ✅ Complete (technical + color system)
- Full new-user flow smoke test ✅
- Full Pro user flow smoke test ✅
- Bug log review + 8 bugs fixed ✅ (see Known Issues log for full list)
- Continued social media asset creation in Canva ✅
- Full app color system cleanup ✅
  - Replaced all 112 legacy blue (`#2d5be3`) tokens with navy (`#2f3e5c`) across Home, Quiz, Auth, Optimize, Resume Health, Explore, Job Detail, and email template
  - Updated all `rgba(45,91,227,...)` opacity variants to `rgba(47,62,92,...)`
  - Updated light tint `#eaeffe` → `#e8edf5` (natural navy tint)
  - Applied `#5171bf` accent to score indicators, wordmark dots, and animated loading states
  - Applied `#a86347` clay to the "You're in." welcome celebration dot
  - Verified wordmark dot consistency across all pages (matches landing page `--blue`)
- Updated launch plan tracking ✅
- Mobile testing pass — not done, carrying to May 30
- Empty state audit — not done, carrying to May 30
- Copy pass — not done, carrying to May 30

> No work May 30–31. Resuming June 1. **Open items carried forward:** mobile testing pass, empty state audit, copy pass, design system (typography + spacing), security pass, email blast (DNS pending), resume upload bug, pricing page.

---

## Open Items — Must Close Before Launch

| Item | Priority | Notes |
|---|---|---|
| Design system integration (typography, spacing, components) | 🔴 Must | Claude Design files available — color tokens done, rest is not |
| Resume upload bug (Claude API 401 — PDFs fail) | 🔴 Must | Core feature broken; needs investigation before launch |
| Mobile testing pass + fix issues | 🔴 Must | Primary audience is mobile; not done yet |
| Empty state audit + fixes | 🔴 Must | Users hit empty states immediately |
| Copy pass (error messages, empty states, onboarding) | 🔴 Must | Tone matters for this demographic |
| Pricing page (Free tier must look valuable) | 🔴 Must | Required for conversion |
| Email blast to waitlist | 🔴 Must | Once Resend DNS resolves — check dashboard |
| Security pass (CSRF headers, `Secure` cookie, RLS audit) | 🔴 Must | Legal/ethical requirement |
| Full regression smoke test | 🔴 Must | Final pass before launch |
| Social content finalization + scheduling | 🟡 Nice | Assets exist; need final review + scheduling for June 7 |
| Animations / micro-interactions | 🟡 Nice | Only if time permits after must-haves |
| Auth redirect for logged-in users hitting `/` or `/auth` | 🟡 Nice | Minor UX gap, not a blocker |
| `runNegotiate` done-ref guard | 🟡 Nice | Edge case, low user impact |

---

## June 1–14 Sprint — 13 Days to Launch

### Monday, June 1 — **Today**
**Design system integration** *(Claude Design files available — this is the biggest visual gap)*
- Download new Claude Design files
- Apply typography updates across internal pages (font choices, weight, size refinements)
- Apply spacing + layout updates (padding, card proportions, component structure)
- Color tokens already done — focus on what requires the design files

**Resume upload bug investigation**
- Diagnose Claude API 401 on `/api/resume` — likely an `ANTHROPIC_API_KEY` env var issue
- Fix and verify PDF text extraction works end-to-end

### Tuesday, June 2 — Mobile testing + empty states
- Mobile testing pass: Home, Quiz, Job Detail, Optimize, Resume Health at 375px + 430px
- Fix every layout break, overflow, or unreadable element found
- Empty state audit: every user-reachable path that shows blank/undefined content
- Fix critical empty states (no resume, no jobs, no tracker items, no search results)

### Wednesday, June 3 — Copy + email blast
- Copy pass: error messages, empty states, onboarding flow, Pro upsell copy
- Confirm Resend DNS status (check dashboard → Domains → MX/SPF/DKIM)
- If DNS verified: `POST /api/admin/send-launch-emails?dry_run=1` to preview, then send
- Requires `RESEND_API_KEY` and `ADMIN_SECRET` in `.env.local`

### Thursday, June 4 — Security + pricing
- Security pass: CSRF headers, `Secure` cookie flag, RLS audit on `profiles`, `resumes`, `tracker`
- Pricing page: Free tier must look genuinely valuable; clear comparison with Pro/Premium
- Final review of social content from Canva (May 28–29) — confirm all assets are ready for June 7

### Friday, June 5 — Regression + bug bash
- Full smoke test: new-user flow, Pro checkout, cancel/save flow, job feed, all AI features
- Fix every issue found — this is the last "fix" day before soft launch week
- Performance check: page load, API response times on mobile connection

### Saturday, June 6 — Buffer + launch prep
- Clear any remaining bugs from June 5
- Schedule June 7–13 social posts in whatever scheduling tool you're using
- Verify production env: all env vars set, Stripe webhook registered, Supabase RLS confirmed
- Final read-through of landing page copy

### Sunday, June 7 — **First social posts go live**
- Post Day 1 content (Reel + carousel per content calendar)
- Monitor for any production issues
- Light bug fixes only — no major changes this week

### Monday, June 8 — Soft launch (friends + beta)
- Share with a small group of real users from the target demographic
- Watch for friction points, broken flows, tone issues
- Collect feedback — prioritize by severity

### Tuesday, June 9 — Beta bug fixes
- Fix anything critical surfaced from June 8 testing
- Final QA pass on mobile (real device if possible)

### Wednesday, June 10 — Launch announcement prep
- Write and schedule launch announcement email (separate from waitlist blast)
- Prepare any launch-day social content that's still needed
- Final check on Stripe, Supabase, Vercel — all systems green

### Thursday, June 11 — Buffer
- Fix any last-minute issues
- Rest

### Friday, June 12 — Buffer
- Final checks only — no new features

### Saturday, June 13 — Rest day
- Verify one more time: sign-up flow, checkout, job feed
- Confirm social posts are scheduled

### **Sunday, June 14 — 🚀 LAUNCH DAY**

---

## Bonus Tasks (Extra Time / Usage)

**High Priority**
- ✅ Intelligent Natural Language Search Bar (with role suggestions and negative prompts)
- ✅ Per-Job Resume Optimization + Before/After comparison
- ✅ Resume Health Score + Candid "fitted. thinks" Insights
- Final polish and deployment of coming-soon.html landing page to getfittedcareers.com

**Medium-High Priority**
- Career Transition Intelligence tuned for women returners and career changers: smart tags ("Realistic Stretch", "Good Next Step", "Ambitious Move"), transitions that account for life gaps, not just linear career paths

**Medium Priority**
- ✅ Personal Career Coach Mode (memory, proactive nudges, continuous learning across sessions)
- ✅ Job-specific Interview Prep Generator
- ✅ Salary Negotiation Scripts (personalized — especially important for the gender pay gap context)
- ✅ AI Preferences toggles in Account modal
- Values-fit filtering: let users flag what matters (flexibility, mission, pay equity, parental leave policies)

**Lower Priority (Nice-to-Haves)**
- Role Explorer ("What Could I Do?" suggestions)
- Multiple Resume Versions Manager
- ATS Compatibility Checker
- Career Path Simulator

---

## Post-Launch Growth & Partnerships

### Anthropic Startup Program Application
- **Goal:** Apply for Anthropic Startup credits once we have:
  - Live product with real users (target: 500+ active users)
  - Some Pro subscription revenue
  - Strong Claude usage demonstrated in the product
- **Prepare one-pager:** product vision, how heavily we use Claude (search, resume optimization, coach mode, health score, etc.), traction metrics
- **Timing:** 4–8 weeks after public launch (June/July 2026)

### Target Partnerships (women-focused)
- Women's professional networks (Elpha, Chief, Lean In chapters)
- University women in business / STEM clubs
- Return-to-work programs (Path Forward, iRelaunch, Après)
- Military spouse transition organizations

---

## Cross-Cutting Concerns

- **Airtight Security & Compliance** (highest priority): Protect user data, API keys, secret codes, promo codes, and demo accounts at all times. Regular OWASP audits, key rotation, and security reviews every sprint.
- **Penetration test before any major deploy**: Auth bypasses, IDOR, RLS gaps, payment manipulation, promo abuse, injection, rate-limit bypasses, key exposure. Report findings with severity. Fix criticals before shipping.
- **Design system enforcement**: Color tokens complete (May 29) — #2d5be3 → #2f3e5c navy, #5171bf accents, #a86347 clay. Typography + spacing integration pending (June 1)
- **Mobile responsiveness**: Primary target is mobile — most of the 22–35 demographic lives on their phone
- **Tone enforcement**: Warm, direct, never condescending. Does not assume the user is applying to be CEO. Does not assume she has no gaps.
- **Social launch readiness**: Content calendar — Instagram primary, TikTok/Shorts secondary. Women-focused career content starting Week 1 of sprint.
- **Beta feedback loop**: Friends + target demographic starting June 8

---

## Known Issues & Bugs (Running List)

**Date** | **Issue** | **Status** | **Notes**
--- | --- | --- | ---
2026-05-29 | Landing page / auth page have no redirect for already-authenticated users | **Open** | Logged-in users who navigate to `/` or `/auth` see the marketing page instead of being sent to `/home`. Minor — most users arrive from bookmarks or direct links.
2026-05-29 | Resume upload silently swallows all errors (401, 429, 500) | **Open** | `catch { /* silent */ }` in upload handler — user sees spinner disappear with no feedback on failure. Needs toast for 401/429.
2026-05-29 | `parsePaste` (paste-a-job) can fire duplicate requests on rapid double-click | **Open** | No guard against concurrent calls — both set `parsing=true` within React batching window. Low frequency edge case; add `parsingRef` before beta.
2026-05-29 | In-memory rate limiter resets on Vercel cold starts | **Open** | Each serverless instance gets a fresh map; brute force across cold starts bypasses the cap. Known limitation — Upstash Redis rate limiting needed before scale.
2026-05-29 | `runNegotiate` (salary negotiation) has no done-ref guard | **Open** | Unlike all other AI functions, repeated clicks fire concurrent Anthropic requests. Button re-enables after loading clears.
2026-05-29 | Webhook `invoice.payment_succeeded` hardcoded `plan: 'pro'` | **Fixed** | Silently downgraded Premium users on every renewal. Now reads existing plan and preserves `'premium'` tier.
2026-05-29 | Cancel and save-offer routes blocked Premium users from cancelling | **Fixed** | `plan !== 'pro'` check returned 400 for Premium subscribers. Updated to allow `'pro' || 'premium'`.
2026-05-29 | Career path `fieldLabel` used wrong 2-letter abbreviation codes | **Fixed** | Field values stored as full words (`'marketing'`, `'engineering'`, etc.) — abbreviation checks always fell through to raw field string, sending lowercase labels to AI prompt.
2026-05-29 | Quiz "Skip" link sent users to landing page (`/`) instead of `/home` | **Fixed** | `href="/"` → `href="/home"` 
2026-05-29 | `refreshJobs` missing try/finally — spinner stuck on malformed API response | **Fixed** | Added try/finally; `.json()` call now also has `.catch(() => ({}))` fallback.
2026-05-29 | `runInterviewPrep` set `prepAIDone.current = true` before the guard check | **Fixed** | Added `if (prepAIDone.current) return` guard at top, consistent with all other AI functions.
2026-05-29 | "Download tailored resume" button had no onClick — silent dead button | **Fixed** | Marked disabled with "coming soon" style and tooltip until feature is implemented.
2026-05-29 | Auth route `error_description` checked twice in fallback chain | **Fixed** | Removed duplicate; also dropped raw `data.error` machine code from user-visible message.
2026-05-22 | React hooks violation in TView (useState called conditionally inside Home) | **Fixed** | Extracted TView as standalone component before Home; trash/drag state is now unconditional
2026-05-07 | PWA home screen icon doesn't match the elegant "f." shown on landing page | **Unfixed** | Current icon has sizing/positioning issues. Needs precise match to mockup.
2026-05-05 | Match scoring too punitive for career changers | **Open** | Scores often 68% or lower even for realistic transitions. Need better directional intelligence — especially critical for returners and career changers in new demographic focus.
2026-05-05 | Resume uploads failing (POST /api/resume returns 400) | **Unfixed** | Claude API returns 401 "invalid x-api-key". PDFs fail to extract text.
2026-05-01 | Adzuna API replaced with Fantastic.jobs (Active Jobs DB) | **Fixed** | Migrated to RapidAPI active-jobs-db; 2-hour Supabase cache; US-prioritized filtering; title-level field relevance post-filter.
2026-05-07 | `useSearchParams()` Suspense error on `/optimize` and `/resume-health` | **Fixed** | Wrapped in `<Suspense>` — pages now build as static.
2026-05-01 | coming-soon.html landing page not live on getfittedcareers.com | **Fixed** | Moved rewrite to `next.config.ts` `beforeFiles`.
<!-- Add new issues above this line, newest first -->

---

## Daily Progress Log (append-only – do not rewrite)

**May 1, 2026**  
- Reviewed launch plan and shifted dates  
- Prepared security and payment tasks for Week 1  

**May 2, 2026** — Week 1 complete  
- Stripe SDK v22 upgrade: all routes updated to `2026-03-25.dahlia`, `current_period_end` read from line items, coupons via `discounts` array  
- Implemented full checkout flow: monthly, annual, resume slot, 24h Pro extension  
- Cancellation save flow: 3-tier discount engine (50%/33%/25%), anti-gaming counter (`discount_offers_used`)  
- Cancel modal: empathetic intent screen → save offer → confirm, optimistic badge update  
- Account Settings modal: profile, subscription card, lazy-loaded receipts/invoices  
- $1.99 24-hour Pro extension: banner (≤3 days left), dedicated modal, success toast  
- Grace period UI: amber banner on `past_due` status, "Update payment" → Stripe portal  
- Webhook: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed` — all handled  
- **Security audit** — findings and fixes:  
  - ✅ `.env.local` confirmed NOT in git (covered by `.env*` in `.gitignore`)  
  - ✅ All env vars loaded via `process.env` — no hardcoded secrets in any route  
  - ✅ Webhook signature verified via `stripe.webhooks.constructEvent` before any DB writes  
  - ✅ All payment endpoints require cookie auth (`getUserFromCookie`) — no unauthenticated writes  
  - ✅ Checkout session ownership verified via `session.client_reference_id === uid` (403 on mismatch)  
  - 🔧 **Fixed**: GET verification handler was reading `type` from the URL query string (user-controlled). Changed to read from `session.metadata.type` (server-set at session creation)  
  - 🔧 **Fixed**: `/api/redeem` was writing `plan: 'pro'` using the user's own JWT + anon key. Changed both the promo code lookup and the profile write to use the service role key  
  - ⚠️ **Known gap — promo TOCTOU**: `used_count` check and increment are two separate REST calls. Low risk at current traffic; Supabase RPC fix deferred.  
  - ⚠️ **Known gap — no server-side rate limiting**: promo code endpoint, save-offer, and cancel can be called rapidly. Add Upstash Redis rate limiting before beta.  
  - ⚠️ **Known gap — `STRIPE_EXTENSION_PRICE_ID` is empty in `.env.local`**: extension checkout will return "not available yet" until price is created in Stripe dashboard.  

---

**May 3, 2026** — Week 2 Day 1

**Adzuna integration + caching layer**
- `lib/adzuna.ts` — API client with field→category mapping, salary parsing, deterministic logo generation, job normalization to fitted. `Job` shape
- `lib/score.ts` — Pure TS match scoring engine: field affinity (0–20) + keyword overlap (0–45) + pay fit (0–15) + seniority (0–10) + location (0–5) = 42–95 range
- `lib/static-jobs.ts` — 30-job server-safe fallback
- Supabase `job_cache` table — `(field, country)` primary key, 2-hour TTL
- `/api/jobs` — full pipeline: Supabase cache → Adzuna fetch → static fallback
- ⏳ **Adzuna key activation**: Code complete — waiting on API key activation

**Job feed UI improvements**
- Skeleton loading cards, differentiated empty states, keyword search bar, seniority filter pills, match ring tooltip

**Job detail page**
- Apply Now button, Save/Unsave toggle, feed star toggle

**Cancel / Save offer flow**
- Cancel modal fully implemented: Intent → Checking → Offer → Confirm → Cancelling

---

**May 4, 2026** — Week 2 Day 2

**Job detail page — live scoring + similar jobs**
- `/api/jobs/[id]` now fetches user profile + active resume in parallel and runs `scoreJob()`
- Similar jobs sidebar: fetches `/api/jobs` in parallel, shows top 3 matches
- Apply tracking: Apply Now auto-moves tracker entry to "Applied"

**Profile panel — career field + stage selectors**
- Career field dropdown (10 options), career stage dropdown (7 options)
- Field change triggers immediate job feed refresh

**Scoring engine improvements**
- `senior` and `executive` career stages now map to senior seniority bucket

**Security (Day 2 audit pass)**
- ✅ M-2, M-3 fixed: `job_id` encoded; `resume_text` bounded at 20,000 chars; profile fields bounded

---

**May 5, 2026** — Week 2 Day 3

**Data source transparency**, **pasted job scoring**, **setup nudge for new users**, **lazy-load similar jobs on detail page**, **Adzuna error logging** — all shipped.

---

**May 6, 2026** — Week 2 Day 5 + Bonus Tasks sprint

**Main Work**: Enhanced job detail page, improved tracker UX, feed card tracker pills.

**Bonus Tasks Completed (7 total)**
1. Intelligent Natural Language Search Bar
2. Per-Job Resume Optimization
3. Resume Health Score
4. Personal Career Coach foundation
5. Job-specific Interview Prep Generator
6. Salary Negotiation Scripts
7. AI Preferences toggles

---

**May 7, 2026** — Week 3 Mobile Responsiveness + Coming Soon Deployment

- Tracker board: vertical stack on mobile, empty columns hidden
- Account modal: full bottom-sheet pattern on mobile
- Job detail page: responsive classes throughout
- Nav sidebar, profile tab, resume upload zone, bottom nav — all mobile-polished
- `public/coming-soon.html` deployed; rewrite moved to `next.config.ts` `beforeFiles`
- Vercel build fix: `useSearchParams()` Suspense wrap on `/optimize` and `/resume-health`
- PWA icons: `icon.svg` + `manifest.json` created
- Stripe cancellation save flow backend complete

---

**May 22, 2026** — Repositioning + Landing Page + Security Audit

**Repositioning (morning)**: fitted. focused on **women aged 22–35** (early career, career changers, returners). Launch plan fully rewritten as a 22-day sprint to June 14.

**Fantastic.jobs integration**:
- Migrated job data from Adzuna → Fantastic.jobs (Active Jobs DB via RapidAPI)
- Two-pass fetch system: strict (location-filtered, US-prioritized) + broader (7d window) fallback
- Title-level field relevance post-filter: removes obvious off-field results before scoring
- Match threshold raised 42 → 55; `allScoresLow` banner updated
- Resume upload nudge suppressed when user has active resumes
- Coach greeting replaced with static "Welcome back. Let's get you closer to the right next fit."
- Textarea auto-grow fixed; React hooks violation fixed (TView extracted as standalone component)
- Back button on /jobs/[id] changed to `router.back()` to preserve history stack

**Landing page rebuild + polish**:
- Hydration error fixed by extracting all inline `<style>` tags to `landing.css` (imported, not inline)
- Hero vertically centered; top nav stripped to logo wordmark only; "Get Started" button no-wraps
- Custom cursor implemented: clay-deep ring (`#a86347`) + dot on hover over interactive elements; `mix-blend-mode: difference`
- Floating accessibility button (bottom-right FAB): Larger Text, High Contrast, Reduce Motion toggles; `localStorage` persistence; body class modifiers
- Production transition confirmed: `vercel.json` is `{}` — unauthenticated users at `/` get full `app/page.tsx`

**Onboarding quiz**:
- Gender question (Q1) confirmed present: "How do you identify?" — Woman / Man / Non-binary / Prefer not to say
- Female personas for woman/nonbinary/skip; male personas for man (`getDemoResume(field, gender)`)
- `gender` confirmed on profile API allowlist

**Tone consistency pass**:
- Removed AI model names (Claude Sonnet/Haiku) from Pro upsell copy in explore page — users don't need infrastructure details
- Quiz gender question copy neutralized: "We use this to load a more relevant demo resume — we'll never use it beyond that."

**Security audit — 4 critical fixes**:
- 🔧 `create-checkout` POST: removed `uid` from `success_url` — user ID was leaking into browser history, server logs, and referrer headers
- 🔧 `create-checkout` GET: rewrote verification handler to authenticate from cookie instead of URL `uid` param; `session.client_reference_id` now verified against cookie user — closes trivial IDOR (any user could claim any payment)
- 🔧 `webhook` catch block: changed from 200 to 500 — Stripe now retries on transient DB failures instead of silently swallowing the error
- 🔧 `resumes` PATCH/DELETE: switched to `return=representation`, returns 404 if no rows matched — prevents silent no-ops on wrong/missing resume IDs

**Known gaps (deferred post-launch)**:
- ⚠️ Rate limiting on Stripe endpoints (no per-user cap on checkout/cancel/save-offer)
- ⚠️ Webhook event deduplication (replayed events re-apply DB updates)
- ⚠️ CSRF headers (currently relying on SameSite=lax only)

---

---

**May 23, 2026** — Polish & Bug Sweep + End-to-End Verification

- Mobile responsiveness verified on landing page (375px / 430px); cursor disabled on touch devices
- Full sign-up → quiz → dashboard → job detail flow smoke-tested on fresh account
- Welcome modal chip: now shows actual demo persona name (extracted from resumes state) instead of field abbreviation
- Match tab: fixed flash of italic text by changing `matchAI` initial state from `''` to `null` (null = not-started, '' = failed)
- Job detail loading state: upgraded from bare text to branded fitted. spinner
- Disliked view: removed duplicate Delete button (was identical to Restore)
- `runMatch()`, `generateCoverLetter()`, `getPrepFeedback()`: all now have try/catch with proper loading reset
- End-to-end flow verification: all 5 checks passed (sign-up, quiz, dashboard, job detail, Pro gate)

Critical Bug Sweep

- Production console.log cleanup: removed 5 debug logs from `/api/jobs`
- `redeem()`: added try/catch/finally — spinner no longer stuck on network failure
- `savePr()`: added try/catch — "Saving…" indicator now always clears, shows "Save failed" on error
- `addTracker()`: wrapped POST + re-fetch in try/catch — star state stays consistent on failure
- `proceedToOffer()`: try/catch added — resets to `'intent'` step on failure
- `applyOffer()`: try/catch added — resets to `'offer'` step on failure, profile re-fetch wrapped in `.catch()`
- `confirmCancel()`: try/catch added — resets to `'confirm'` step on failure
- `runOptimize()`, `runExplore()`, `runAnalysis()`: all wrapped in try/catch/finally — users no longer stuck on loading screen after network failure

Career Path AI + Error Boundaries + Prompt Hardening

- AI Career Path tab: replaced 5 hardcoded static nodes with AI-generated personalized roadmap
  - Prompt sends career stage, field (with human-readable label), About Me, resume excerpt
  - Returns JSON `{summary, nodes[{role, pay, insight}]}` — dots and stage labels assigned by position (not AI-generated)
  - Static fallback renders if AI returns null — Pro users never see a blank screen
  - Regenerate button resets `careerDone.current` and re-runs
- Error boundaries added:
  - `app/error.tsx`: catches crashes in any route, shows fitted.-branded "Try again / Go to dashboard" UI
  - `app/global-error.tsx`: catches root layout crashes (per Next.js 16.2 `unstable_retry` convention)
- Career path prompt hardened:
  - Removed `dot` and `stage` from AI output schema (eliminates malformed-JSON failures)
  - Added field/stage label expansion (AI gets "Marketing" not "MA")
  - Explicit pay format rules, specific title guidance, 5-node structure enforcement
- TypeScript: clean on all changes (0 errors, `--noEmit --skipLibCheck`)
- Stripe flow assessment: all backend routes verified correct; two operational prerequisites flagged (coupon IDs must exist in Stripe; webhook endpoint must be registered)

Security Audit + Backend Hardening (May 26 work pulled forward)

- Comprehensive security audit: reviewed all API routes against OWASP top-10 patterns; dismissed several false positives (service-role key correctly gated by auth, GET returning empty for unauthenticated state is intentional)
- `lib/rate-limit.ts` created: in-memory dual-gate rate limiter (IP + user-ID); applied to `/api/ai`, `/api/optimize`, `/api/resume-health`, `/api/explore`, `/api/resume`, `/api/redeem`, and all three Stripe endpoints
- Promo TOCTOU: rewrote `/api/redeem` to call a single atomic Supabase RPC (`redeem_promo_code`) with `SELECT ... FOR UPDATE`; SQL migration written; Supabase applied ✅
- Tracker upsert: replaced non-atomic check-then-PATCH+INSERT in `/api/tracker` POST with a single `resolution=merge-duplicates` upsert; unique constraint migration written and applied ✅
- Optimistic locks: `discount_offers_used` increment in `save-offer` (apply action) and `cancel-subscription` now use conditional PATCH filtered on current counter value — concurrent requests get 409 / graceful fallback
- Stripe webhook deduplication: `stripe_events` table with PK `event_id`; handler inserts before processing; duplicate delivery returns 200 immediately; transient DB error returns 500 (Stripe retries); 7-day lazy cleanup on each invocation; migration written and applied ✅
- TypeScript: clean throughout (`tsc --noEmit` zero errors after each batch)

*(New entries added at end of each day via Claude Code ritual)*

---

**May 29, 2026** — Smoke Test + Bug Log Review

Full new-user and Pro-user flow smoke test completed (code review, not browser):

**8 bugs fixed:**
- 🔧 Webhook `invoice.payment_succeeded` hardcoded `plan: 'pro'` — silently downgraded Premium users on every renewal. Fixed to preserve existing plan tier.
- 🔧 Cancel-subscription and save-offer routes returned 400 for Premium users — plan check updated to allow `'pro' || 'premium'`.
- 🔧 Career path AI prompt received wrong field labels — stored values are full words (`'marketing'`) but ternary chain checked 2-letter codes (`'MA'`). Field label always fell through to the raw string.
- 🔧 Quiz "Skip to dashboard" link pointed to `/` (landing page) instead of `/home`.
- 🔧 `refreshJobs` missing `try/finally` — spinner got permanently stuck if `res.json()` threw.
- 🔧 `runInterviewPrep` missing `if (prepAIDone.current) return` guard — inconsistent with all 4 other AI functions, allowing duplicate concurrent requests.
- 🔧 "Download tailored resume" button had no `onClick` — silent dead button. Marked disabled with "coming soon" tooltip.
- 🔧 Auth route `error_description` checked twice in fallback chain; raw machine error code `data.error` was the last fallback shown to users.

**4 open issues logged (not blockers, defer to beta):**
- Authenticated users hitting `/` or `/auth` see marketing page instead of being redirected to `/home`
- Resume upload silently swallows 401/429/500 — no user feedback
- `parsePaste` can fire duplicate AI requests on rapid double-click
- `runNegotiate` missing done-ref guard (concurrent requests possible)

TypeScript: 0 errors after all fixes.
