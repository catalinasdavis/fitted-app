# fitted Launch Plan

**Founder**: Catalina Davis  
**Target Launch Date**: Saturday, June 14, 2026  (exactly one year after I graduated from the University of Washington)
**Buffer Launch Date**: Saturday, June 20, 2026 (Week 7 — only if quality demands it)  
**Domain**: www.getfittedcareers.com (pending DNS)  
**Repo**: github.com/catalinasdavis/fitted-app  
**Local Path**: /Users/catalinalittle/Documents/fitted  
**Hosting**: Vercel (Production)  
**Database**: Supabase (Postgres + Auth + RLS)  
**Payments**: Stripe SDK v22 (API version 2026-03-25.dahlia)

**Last updated**: May 2, 2026  
**Current phase**: Week 2 — Real Job Data

## Overview & Philosophy

We are building **fitted.** — a sophisticated AI-powered career platform with a quiet-luxury, editorial aesthetic.

Every decision is measured against four lenses:
1. **Product** — Would a user in the middle of a stressful job search actually feel helped?
2. **Code quality** — Would a strong engineer reviewing this later cringe?
3. **Investor-readiness** — Does this hold up to someone who might one day acquire, fund, or partner with us?
4. **User experience** — Does this treat job seekers like intelligent adults who deserve real guidance?

**Test for everything**: “Would I be proud to show this to someone I respect?”

---

## Monetization & Pricing Model (v1)

**Tiers**

- **Pro** — $9/month or $90/year (2 months free)
  - 30 AI Actions per month
  - All core Pro features
  - Ability to buy additional AI Action packs

- **Premium** — $16–18/month or $160–180/year (2 months free)
  - Unlimited AI Actions
  - Priority access + all Pro features

**AI Actions System**
- We no longer show raw token counts to users
- All AI features (search, resume optimization, health score, Ask Fitted., coach nudges, interview prep, etc.) consume from a unified “AI Actions” pool
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

## Week-by-Week Roadmap

### Week 1 — Payment System (May 2 – May 8) ✅ COMPLETE
**Theme**: The financial spine. Must be airtight before real users pay real money.

- [x] Build Account Settings modal (Profile + Subscription sections)
- [x] Build Save Offer modal ("Before you go — here's 50% off your next month")
- [x] Build Confirm Cancel modal — empathetic intent screen → save offer → confirm
- [x] Wire all three modals to save-offer and cancel-subscription APIs
- [x] Fix subscription_status spelling mismatch ('cancelled' → 'canceling')
- [x] Phase 4: $1.99 24-hour Pro extension button + banner + modal
- [x] Failed payment 3-day grace period UI + webhook (amber banner, "Update payment" → portal)
- [x] Receipts/invoices in Account Settings (lazy-loaded, View + PDF links)
- [x] Security audit completed — two vulnerabilities fixed (see May 2 log)
- [ ] Stripe Tax enabled + annual renewal reminder *(deferred to pre-launch week)*
- [ ] Production cutover (live keys, webhook deploy, key rotation, legal docs) *(Week 5/6)*

**Week 1 Checkpoint**: Friday, May 8 ✅ — pen test complete (see May 2–3 log)

### Week 2 — Real Job Data (May 9 – 15)
**Theme**: Static jobs are fatal. Real people need real jobs.

**Tasks**:
- Adzuna API integration + caching layer
- Quiz-based job search wired to Adzuna filters
- Match scoring tuned for real job descriptions
- Apply links working
- Fallback strategy for API limits/downtime

**Week 2 Checkpoint**: Friday, May 15 — run pen test before closing

### Week 3 — Mobile Design + Build (May 16 – 22)
**Theme**: Most traffic is mobile. This is the heaviest week.

**Tasks**:
- Full mobile-responsive pass (single column + bottom nav)
- Tracker kanban → vertical stack
- Job detail page reflow
- Touch targets, font sizes, safe-area handling

**Week 3 Checkpoint**: Friday, May 22 — run pen test before closing

### Week 4 — Onboarding + Polish (May 23 – 29)
**Theme**: First impressions matter.

**Tasks**:
- Welcome modal → guided onboarding flow
- Interactive tour (custom, not third-party)
- Empty states for every screen
- Smart defaults based on quiz
- Onboarding email sequence (nice-to-have)

**Week 4 Checkpoint**: Friday, May 29

### Week 5 — Beta + Domain + Demo Account (May 30 – June 5)
**Theme**: Real users, real feedback, and partner-ready assets.

**Tasks**:
- Distribute beta promo codes
- Point custom domain at Vercel
- Monitor logs and fix issues in real time
- Gather structured feedback
- **Create dedicated demo account** (clean, realistic sample data, fully locked down) for videos and partner presentations (SLED, colleges, military transition organizations)

**Week 5 Checkpoint**: Friday, June 5

### Week 6 — Public Surface + Launch Prep (June 6 – 12)
**Theme**: Everything a stranger sees before signing up.

**Tasks**:
- Marketing landing page (sophisticated, matches in-app aesthetic)
- SEO basics + OG images
- Final end-to-end QA as a new user
- Prepare launch-day social content
- **Launch social media campaign 2 weeks early (starting May 30)**: Instagram primary (premium, thoughtful tone), TikTok/YouTube Shorts secondary. Use Notion content calendar.
- **Finalize and announce Founding Members (First 100) & Early Access (Next 100) program**:
  - **Founding Members (First 100)**: 50% off first month + Early Access perks
  - **Early Access (Next 100)**: 25% off first month
  - **Suggested Perks** (finalize these): priority job matching, exclusive career webinars, dedicated support, early feature access, invite-only community, personalized onboarding call

**Week 6 Checkpoint**: Thursday, June 11

**🚀 Launch**: Saturday, June 13, 2026

**Week 7 — Buffer** (June 13 – 20, only if needed)

## Bonus Tasks (Extra Time / Usage)

These are high-value features we can tackle when main weekly goals are complete and usage remains.

**High Priority**
- ✅ Intelligent Natural Language Search Bar (with role suggestions and negative prompts)
- ✅ Per-Job Resume Optimization + Before/After comparison
- ✅ Resume Health Score + Candid "fitted. thinks" Insights
- Final polish and deployment of coming-soon.html landing page to getfittedcareers.com (with proper Vercel config)

**Medium-High Priority**
- Improved Career Transition Intelligence: Add smart tags ("Realistic Stretch", "Good Next Step", "Ambitious Move") and better suggestions for users changing fields. Make recommendations feel like a thoughtful career coach instead of purely algorithmic.

**Medium Priority**
- ✅ Personal Career Coach Mode (memory, proactive nudges, continuous learning across sessions)
- ✅ Job-specific Interview Prep Generator
- ✅ Salary Negotiation Scripts (personalized)
- ✅ AI Preferences toggles in Account modal (users can control auto-generation per feature)
- Better About Me Editor: Expand to a large modal/popup textarea when editing, with autosave or clear Save button. Fix small-box scrolling frustration.
- Social media content templates + posting calendar (using fitted. design system)

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

---

## Cross-Cutting Concerns (tracked every week)

- **Airtight Security & Compliance** (highest priority): Protect user data, API keys, secret codes, promo codes, and demo accounts at all times. No one can hack in, steal info, or get free codes. Regular OWASP audits, key rotation, and security reviews in every phase.
- **Friday penetration test (every week, no exceptions)**: At the end of each Friday checkpoint, run a full black-hat hacker audit on the current codebase. Cover: auth bypasses, IDOR, RLS gaps, payment manipulation, promo abuse, injection, rate-limit bypasses, key exposure, and any new attack surface introduced that week. Report findings with severity. Fix criticals before closing the week.
- **Stripe integration**: Currently in Phase 3 of Week 1
- **Design system enforcement**: Replace #2d5be3 blue with #2f3e5c navy everywhere
- **Mobile responsiveness**: Heavy focus in Week 3
- **Social launch readiness**: Content calendar in Notion
- **Beta feedback loop**: Starts Week 5

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
  - 🔧 **Fixed**: GET verification handler was reading `type` from the URL query string (user-controlled). Changed to read from `session.metadata.type` (server-set at session creation) — prevents a paid `resume_slot` session being replayed as `pro_extension`  
  - 🔧 **Fixed**: `/api/redeem` was writing `plan: 'pro'` using the user's own JWT + anon key. Any user with knowledge of the PostgREST API could escalate their own plan without a code. Changed both the promo code lookup and the profile write to use the service role key  
  - ⚠️ **Known gap — promo TOCTOU**: `used_count` check and increment are two separate REST calls with no atomic transaction. Low risk at current traffic, but a Supabase RPC (`redeem_promo_code`) with a `WHERE used_count < max_uses` guard would close it before heavy scale  
  - ⚠️ **Known gap — no server-side rate limiting**: promo code endpoint, save-offer, and cancel can be called rapidly. Vercel's built-in DDoS protection covers abuse at the infra level; add Upstash Redis rate limiting before beta launch (Week 5)  
  - ⚠️ **Known gap — `STRIPE_EXTENSION_PRICE_ID` is empty in `.env.local`**: extension checkout will return "not available yet" until price is created in Stripe dashboard and env var is populated  

*(New entries added at end of each day via Claude Code ritual)*

**May 3, 2026** — Week 2 Day 1

**Adzuna integration + caching layer**
- `lib/adzuna.ts` — API client with field→category mapping, salary parsing, deterministic logo generation, job normalization to fitted. `Job` shape
- `lib/score.ts` — Pure TS match scoring engine: field affinity (0–20) + keyword overlap (0–45) + pay fit (0–15) + seniority (0–10) + location (0–5) = 42–95 range; user-specific, computed fresh per request
- `lib/static-jobs.ts` — 30-job server-safe fallback, no `'use client'`, all 10 fields × 3 jobs, LinkedIn fallback URLs
- Supabase `job_cache` table — `(field, country)` primary key, 2-hour TTL, stores raw Adzuna jobs (scores excluded — user-specific)
- `/api/jobs` — full pipeline: Supabase cache → Adzuna fetch → static fallback; parallel resume + cache fetch; scores injected at response time
- `/api/jobs/[id]` — cache scan → static fallback → 404
- ⏳ **Adzuna key activation**: Code complete — waiting on API key activation (retry tomorrow, May 4)

**Job feed UI improvements**
- Skeleton loading cards (5 animated shimmer cards matching JC layout — replaces plain "Finding jobs…" text)
- Differentiated empty states: "No jobs loaded yet" with profile CTA vs. "No jobs match this filter" with job count + clear button
- Keyword search bar (free, all users) — live-filters title / company / location / tags with × clear
- Seniority filter pills — Any level / Entry / Mid / Senior, title-based detection, purple accent
- Match ring tooltip — native `title` attribute: "74% match — Strong fit / Good fit / Fair fit / Low fit"

**Job detail page**
- Apply Now button in nav, header, and sidebar — opens `job.url` in new tab; graceful fallback text when URL absent
- Save / Unsave toggle — ☆ Save → ★ Saved (amber) in nav; writes to Supabase `tracker` via `/api/tracker`; reflects saved state on page load; unsave soft-deletes entry
- Feed star toggle — ★/☆ on feed cards now toggles (was add-only — clicking a saved job now removes it)

**Cancel / Save offer flow** (completed alongside Week 2 Day 1 work)
- Cancel modal fully implemented: Intent → Checking → Offer (50% off) → Confirm → Cancelling
- Animated dot spinner, × close button on all non-loading steps, calm non-desperate tone
- "Manage subscription" and "Cancel subscription" removed from nav — consolidated into Account Settings modal only
- Optimistic Pro badge update on cancel: `subscription_status: 'canceling'` reflected immediately

---

**May 4, 2026** — Week 2 Day 2

**Job detail page — live scoring + similar jobs**
- `/api/jobs/[id]` now fetches user profile + active resume in parallel and runs `scoreJob()` before returning — job detail pages show real match % instead of 0%
- Similar jobs sidebar wired: fetches `/api/jobs` in parallel on page load, shows top 3 matches excluding current job
- Apply tracking: Apply Now buttons converted from `<a>` tags to buttons — clicking a saved job auto-moves tracker entry to "Applied" column via PATCH

**Profile panel — career field + stage selectors**
- New "Career" section at top of profile panel (above About me)
- Career field dropdown: 10 options (Marketing, Sales, Tech, Creative, Healthcare, Legal, Engineering, Finance, HR, Nonprofit)
- Career stage dropdown: 7 options (college, recent, working, senior, executive, changing, returning)
- Field change triggers immediate job feed refresh; both fields update profile state optimistically for instant badge update
- Feed header badge shows human-friendly field name ("Technology" not "tech")

**Scoring engine improvements**
- Added `senior` and `executive` career stages → senior seniority bucket (fixes 10-year professionals scoring as mid-level)
- Consistent `career_stage` default (`'working'`) across both job routes

**Security (Day 2 audit pass)**
- ✅ M-2 fixed: `job_id` in tracker POST now `encodeURIComponent`-encoded in PostgREST filter
- ✅ Tracker PATCH, resumes PATCH/DELETE: `id` params encoded for defense-in-depth
- ✅ M-3 fixed: `resume_text` bounded at 20,000 chars at upload; `name` validated ≤ 200 chars
- ✅ Profile fields bounded at write time: `about_me` ≤ 2,000, `pay_target` ≤ 100, `locations` ≤ 10 × 100 chars
- ⚠️ M-4 (JWT not revoked on sign-out) — deferred; requires Upstash Redis or Supabase token blacklist
- ⚠️ TOCTOU promo race — still low risk at current traffic; Supabase RPC fix deferred to Week 5

**Status**
- ⏳ Adzuna key still at placeholder — retry with actual keys tomorrow (May 5)
- Week 2 code tasks are functionally complete; pending live data validation with Adzuna

---

---

**May 5, 2026** — Week 2 Day 3

**Data source transparency**
- `/api/jobs` now returns `source: 'adzuna' | 'cache' | 'static'` (was always `'fresh'` on fallback — couldn't distinguish)
- Feed header banner is source-aware: green "✦ Live jobs" for Adzuna/cache, muted grey "Sample jobs…" for static fallback

**Pasted job scoring**
- Pasted jobs now use real `scoreJob()` engine with user's active resume + profile context
- `pasteText` passed as `description` (1200 chars) for meaningful keyword overlap — no more hardcoded 75%
- Imported `scoreJob` from `lib/score` client-side (pure TS, no server env vars needed)

**UX: setup nudge for new users**
- Amber banner above feed when career_field or active resume is missing
- Inline links: "Set your career field →" (opens Profile tab on mobile) and "upload a resume →" (triggers file input)
- Hides automatically once both are set

**Performance: lazy-load similar jobs on detail page**
- Critical path (job + user/profile/resumes/tracker) stays at 5 parallel fetches — page renders immediately
- `/api/jobs` fires as a 6th independent fetch and populates Similar roles sidebar when it resolves
- Prevents Adzuna latency (up to ~2s) from blocking the entire detail page display

**Adzuna error logging**
- 401 response now logs activation hint + body snippet to server console
- Successful fetch logs field + result count at the point of fetch

**Status**
- ⏳ Adzuna keys still at placeholder (`your_app_id_here`) — need real keys from developer.adzuna.com
- All Week 2 code is complete and tested with static fallback
- Ready for live validation once keys activate

---

**2026-05-06 — Week 2 Day 5 + Bonus Tasks sprint**

**Main Work**
- Enhanced job detail page: tracker status badges in header pill row, SVG arc match rings (replacing flat stat cards), similar jobs shimmer skeleton while loading
- Improved tracker UX: meaningful empty state with "Browse jobs →" CTA, date added + 📝 notes dot on cards, logical smart move buttons (NEXT map: saved→[applied,phone], applied→[phone,interview], etc.)
- Feed cards now show tracker column pills for jobs past "Saved" (applied, interview, offer, etc.)

**Bonus Tasks Completed (7 total)**
1. **Intelligent Natural Language Search Bar** — NLP query parsing via Claude Haiku; structured filters applied client-side; include/exclude pills; role suggestions; purple active state
2. **Per-Job Resume Optimization** — `/optimize` page + `/api/optimize`; before/after suggestion cards; keyword analysis; Pro gate after 2 suggestions
3. **Resume Health Score** — `/resume-health` page + `/api/resume-health`; 5-dimension scoring; A+–D− grade; "fitted. thinks" summary; blindspot cards with severity/fix; Pro gate
4. **Personal Career Coach foundation** — `coach_memory` JSONB on profiles; `/api/coach` route; welcome-back nudge after 3-day absence (Haiku, 7-day dismiss cooldown); rolling summary updated every 5 actions; purple nudge banner in feed
5. **Job-specific Interview Prep Generator** — "✦ Generate Interview Prep" on Prep tab; category-badged cards; "fitted. thinks" talking points (Pro); 8 questions Sonnet / 4 Haiku; per-answer feedback retained
6. **Salary Negotiation Scripts** — "✦ Prepare My Negotiation" on Prep tab; target range callout; opening script + talking points + pushback responses; counter-offer + email template (Pro); blurred gate for Free
7. **AI Preferences toggles** — 6 toggles in Account modal (Match Insights, Tailor, Stand Out, fitted. thinks, Interview Prep, Negotiate); saves to `ai_prefs` JSONB on profiles; job detail page respects all prefs; approximate AI activity counter for Pro

**Bug fix**
- Resume uploads (POST /api/resume): fixed PDF filename fallback (empty MIME + .pdf extension fell through extractText branches); added Claude API error logging

---

**2026-05-07 — Week 3 Mobile Responsiveness (Day 1 + Day 2) + Coming Soon Deployment**

**Week 3 Day 1 — Mobile Foundation**
- Tracker board: vertical column stack on mobile (`flex-direction:column`), empty columns hidden (`tracker-col-empty` class + `display:none`)
- Account modal: full bottom-sheet pattern on mobile (`align-items:flex-end`, `border-radius:20px 20px 0 0`, `max-height:92vh`, full-width)
- Job detail page (`/jobs/[id]`): `jd-nav`, `jd-layout`, `jd-content`, `jd-sidebar` responsive classes; SVG arc rings grid → column on mobile; shimmer keyframe consolidated

**Week 3 Day 2 — Polish + Remaining Pages**
- Nav sidebar: `nav-subtitle`, `nav-divider`, `nav-search` hidden on mobile
- Profile tab (RP): `rp-mob` class removes double-padding (main-feed already provides padding); `.rp-mob{padding:0!important}`
- Resume upload zone redesigned: icon layout (`📄` + label + file type hint), `resume-upload-zone` class, cleaner tap target
- Resume rows: clickable Health Score link integrated
- Account button added to mobile Profile tab header (flex row with "My Resumes" heading)
- Bottom nav: `minHeight:44` for proper touch targets
- Upgrade modal: bottom-sheet on mobile (`up-overlay`/`up-card` classes)
- Natural language search input: `nl-search-input` class
- Job detail header polish: `jd-job-header`, `jd-job-title`, `jd-apply-btn` tighter sizing on mobile
- Resume Health page: `rh-page`, `rh-score-card` classes; score card → column on mobile

**Coming Soon Deployment**
- `public/coming-soon.html` added — full landing page with countdown, marquee, features grid, PWA install guide
- Root rewrite issue: `vercel.json` rewrites are overridden by Next.js routing manifest on Vercel framework deployments; fixed by moving rewrite to `next.config.ts` `beforeFiles` (runs inside Next.js router before app-directory lookup)

**Vercel Build Fix**
- Build error: `useSearchParams() should be wrapped in a suspense boundary at page "/optimize"` (same on `/resume-health`)
- Fix: extracted component body into `OptimizeInner` / `ResumeHealthInner`; default export wraps in `<Suspense>` with loading fallback; both pages now build as `○ (Static)`

**PWA Icons**
- Created `public/icon.svg` — 512×512 dark bg (`#1a1a1f`), "f" in off-white Georgia serif (`#faf9f6`), "." in italic taupe (`#b8a99a`), rounded corners (`rx=114`)
- Created `public/manifest.json` — name "fitted.", `theme_color`/`background_color` `#1a1a1f`, SVG icon reference
- Added `<link rel="manifest">`, `<link rel="icon">`, `<link rel="apple-touch-icon">` to `coming-soon.html` head

**Stripe Cancellation Save Flow (backend complete)**
- `/api/stripe/cancel-subscription` — cancels at period end, marks `cancelled_at` in profiles
- `/api/stripe/save-offer` — checks eligibility (monthly Pro, ≤2 prior offers), applies 50% coupon for 3 months
- `/api/stripe/webhook` — handles `customer.subscription.updated` to sync cancel/reactivate state
- Frontend modal (cancel → offer → confirm flow) not yet built — tracked in open plan

---

## Known Issues & Bugs (Running List)

**Date** | **Issue** | **Status** | **Notes**
--- | --- | --- | ---
2026-05-05 | Match scoring too punitive for career changers | **Open** | Scores often 68% or lower even for realistic transitions (e.g. retail/aerospace → marketing/partnerships/luxury brands/sponsorships). Need better "directional" intelligence with tags like "Realistic Stretch", "Good Transition Path".
2026-05-05 | Resume uploads failing (POST /api/resume returns 400) | **Unfixed** | Claude API returns 401 "invalid x-api-key". PDFs fail to extract text.
2026-05-01 | Adzuna API returns 400/401 errors | **Unfixed** | AUTH_FAIL or HTML error page. Still falling back to static jobs.
2026-05-07 | `useSearchParams()` Suspense error on `/optimize` and `/resume-health` | **Fixed** | Wrapped in `<Suspense>` — pages now build as static. |
2026-05-01 | coming-soon.html landing page not live on getfittedcareers.com | **Fixed** | Moved rewrite to `next.config.ts` `beforeFiles`; `vercel.json` insufficient for Next.js framework deployments on Vercel. |
<!-- Add new issues above this line, newest first -->

---

**Last updated**: May 7, 2026  
**Next checkpoint**: Friday, May 15 (Week 2 checkpoint)