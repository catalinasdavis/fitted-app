import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// STRIPE INTEGRATION — SAVE FLOW OFFER ENGINE
//
// When a Pro user clicks "Cancel Subscription", we intercept with a discount offer.
// Tier 1 (offers_used=0): 50% off next month
// Tier 2 (offers_used=1): 33% off next month
// Tier 3 (offers_used=2): 25% off next month
// After 3 used: no offer — straight to confirm-cancel modal.
//
// Anti-gaming: each tier can only be offered/used ONCE per user, ever.
// Cancel → re-subscribe → cancel again? Next tier offered, never the same one twice.
//
// Annual subscribers skip this entirely (the next-month discount has no
// real meaning when next renewal is ~12 months away).
//
// Stripe SDK v22 note: recurring.interval lives on the subscription's line items,
// not the subscription itself.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Stripe coupon IDs — must match what was created in the Stripe dashboard
const COUPONS: Record<number, string> = {
  1: 'SAVE_FLOW_50',
  2: 'SAVE_FLOW_33',
  3: 'SAVE_FLOW_25',
}

const TIER_INFO: Record<number, { percent: number; label: string }> = {
  1: { percent: 50, label: '50% off your next month' },
  2: { percent: 33, label: '33% off your next month' },
  3: { percent: 25, label: '25% off your next month' },
}

async function getUser(token: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })
  return res.ok ? await res.json() : null
}

async function getProfile(userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] || null
}

async function updateProfile(userId: string, updates: Record<string, any>) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(updates),
    }
  )
  return res.ok
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = await getUser(token)
  if (!user?.id) {
    return NextResponse.json({ error: 'Invalid auth' }, { status: 401 })
  }

  const body = await request.json()
  const action = body.action as 'check' | 'apply'

  const profile = await getProfile(user.id)
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.plan !== 'pro' || !profile.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active Pro subscription' }, { status: 400 })
  }

  // Detect monthly vs annual via the first line item's recurring interval
  let isMonthly = true
  try {
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const interval = sub.items.data[0]?.price?.recurring?.interval
    isMonthly = interval === 'month'
  } catch (err) {
    console.error('Failed to retrieve subscription for interval check:', err)
    return NextResponse.json({ error: 'Could not verify subscription' }, { status: 500 })
  }

  const offersUsed: number = profile.discount_offers_used || 0
  const nextTier = offersUsed + 1

  // ACTION: CHECK — what should we offer (if anything)?
  if (action === 'check') {
    if (!isMonthly) {
      return NextResponse.json({ hasOffer: false, reason: 'annual' })
    }
    if (nextTier > 3) {
      return NextResponse.json({ hasOffer: false, reason: 'exhausted' })
    }
    return NextResponse.json({
      hasOffer: true,
      tier: nextTier,
      percent: TIER_INFO[nextTier].percent,
      label: TIER_INFO[nextTier].label,
    })
  }

  // ACTION: APPLY — apply the discount coupon to the live subscription
  if (action === 'apply') {
    if (!isMonthly) {
      return NextResponse.json({ error: 'Save flow does not apply to annual plans' }, { status: 400 })
    }
    if (nextTier > 3) {
      return NextResponse.json({ error: 'No offers remaining' }, { status: 400 })
    }

    const couponId = COUPONS[nextTier]

    try {
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        coupon: couponId,
      })

      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)

      await updateProfile(user.id, {
        discount_offers_used: nextTier,
        active_discount_tier: TIER_INFO[nextTier].percent,
        active_discount_expires_at: expiresAt.toISOString(),
      })

      return NextResponse.json({
        success: true,
        tier: nextTier,
        percent: TIER_INFO[nextTier].percent,
      })
    } catch (err: any) {
      console.error('Failed to apply save offer:', err)
      return NextResponse.json({ error: 'Failed to apply discount' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
