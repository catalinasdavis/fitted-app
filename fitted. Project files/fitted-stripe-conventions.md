# fitted Stripe Conventions

Reference for any Stripe-related work in fitted. SDK v22.x has subtle breaking changes from earlier versions; this doc captures the ones that have already cost time.

## Versions

- **SDK**: stripe-node v22.x
- **API version pin**: `'2026-03-25.dahlia'` — pin this explicitly in the Stripe client constructor
- **Never** use `as any` to bypass v22 type errors. The types are correct; the code is wrong.

```ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});
```

## v22 type structure — the gotcha

In SDK v22, several fields **moved off the subscription object** and onto the subscription items:

| What you want | Where it actually lives in v22 |
|---|---|
| `current_period_end` | `subscription.items.data[0].current_period_end` |
| `current_period_start` | `subscription.items.data[0].current_period_start` |
| `recurring.interval` | `subscription.items.data[0].price.recurring.interval` |
| `recurring.interval_count` | `subscription.items.data[0].price.recurring.interval_count` |

If TypeScript complains that one of these "doesn't exist on subscription" — believe TypeScript. Don't `as any`. Move the access onto the item.

## Pricing surfaces

Three checkout flows + one portal flow. All routed through `app/api/stripe/route.ts`:

- `monthly` → $9/mo Pro subscription
- `annual` → $89/yr Pro subscription
- `resume_slot` → $4.99 one-time, grants permanent +1 resume slot
- `portal` → opens Stripe Customer Portal for sub management

## Endpoints

- `POST /api/stripe` — creates checkout sessions and portal sessions based on `type` field in request body
- `GET /api/stripe?session_id=...` — post-payment verification, used by the success page
- `POST /api/stripe/webhook` — Stripe → our app webhook listener

## RLS escape hatch — when to use SUPABASE_SERVICE_ROLE_KEY

Use the service role key on the server (never the client) for:

- The post-payment GET endpoint (verifying the session and updating user plan/slot status before the redirect)
- The webhook handler (Stripe is the trust boundary; webhook events bypass user auth)

For everything else, use the regular authenticated supabase client and respect RLS.

## Webhook signature verification — Next.js App Router gotchas

The most common signature failures, ranked by frequency:

1. **Body parsing**. Next.js App Router auto-parses JSON. Stripe needs the raw body. Use `await request.text()` and pass to `stripe.webhooks.constructEvent(rawBody, sig, secret)`.
2. **Wrong signing secret**. Local dev needs the secret from the Stripe CLI listener output (`whsec_...`), not the dashboard one. Production uses the dashboard endpoint secret.
3. **`STRIPE_WEBHOOK_SECRET` not set in `.env.local`**. After every fresh `stripe listen`, the secret may rotate.
4. **Missing the `stripe-signature` header**. Mostly an issue with proxies or rewriting middleware.
5. **Time skew**. Default tolerance is 5 minutes. Almost never the actual cause but worth ruling out last.

## Institutional / SLED billing

NOT per-seat Stripe billing. Use:

- Flat-rate annual contract (handled outside Stripe — invoice / PO)
- Batch promo codes (one code unlocks Pro for N users)
- The `promo_codes` table in Supabase tracks redemption counts

If anyone proposes routing institutional billing through Stripe per-seat, push back — it adds complexity for zero benefit at this stage.

## Things to never do

- `as any` on Stripe types — fix the access path instead
- Use `--dangerously-skip-permissions` for any Stripe-touching code change
- Hardcode the API version anywhere except the SDK constructor
- Trust client-side data on the success/verification endpoint — always re-verify the session via Stripe API
- Commit any test secret keys (use `.env.local`, never `.env`)
