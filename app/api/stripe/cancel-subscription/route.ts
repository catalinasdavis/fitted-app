import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// STRIPE INTEGRATION — CANCEL SUBSCRIPTION
//
// Called when a user declines the save offer (or when there's no offer to show)
// and confirms cancellation in the final modal.
//
// We cancel at period end — user keeps Pro until the period they paid for ends.
// We also increment discount_offers_used (if < 3 and the user is monthly) so
// they can't game the system by cancel → re-subscribe → see same tier offer again.
//
// Stripe SDK v22 note: current_period_end and recurring.interval live on the
// subscription's line items, not the subscription itself.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

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

  const profile = await getProfile(user.id)
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.plan !== 'pro' || !profile.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active Pro subscription' }, { status: 400 })
  }

  try {
    // Fetch current subscription state to detect monthly vs annual
    const subBefore = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const firstItemBefore = subBefore.items.data[0]
    const isMonthly = firstItemBefore?.price?.recurring?.interval === 'month'

    // Cancel at period end (user keeps Pro through what they paid for)
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      { cancel_at_period_end: true }
    )

    // In SDK v22, current_period_end lives on the line item, not the subscription
    const firstItem = subscription.items.data[0]
    if (!firstItem) {
      throw new Error('Subscription has no line items — cannot read period end')
    }
    const periodEndUnix = firstItem.current_period_end
    const periodEndIso = new Date(periodEndUnix * 1000).toISOString()

    const offersUsed: number = profile.discount_offers_used || 0

    const updates: Record<string, any> = {
      subscription_status: 'canceling',
      cancel_at_period_end: true,
      current_period_end: periodEndIso,
    }

    // Only increment the save-flow counter for monthly users who still had
    // a tier to be offered. Annual users and exhausted-tier users don't move
    // the counter (they didn't see a save offer).
    if (isMonthly && offersUsed < 3) {
      updates.discount_offers_used = offersUsed + 1
    }

    await updateProfile(user.id, updates)

    return NextResponse.json({
      success: true,
      cancels_at: periodEndIso,
    })
  } catch (err: any) {
    console.error('Failed to cancel subscription:', err)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
