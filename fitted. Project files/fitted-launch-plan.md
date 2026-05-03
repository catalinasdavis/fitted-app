# fitted Launch Plan

**Founder**: Catalina Davis  
**Target Launch Date**: Saturday, June 13, 2026  
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

**Last updated**: May 2, 2026  
**Next checkpoint**: Friday, May 8 (Week 2 checkpoint)