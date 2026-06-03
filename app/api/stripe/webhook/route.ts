import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const WEBHOOK_SECRET     = process.env.STRIPE_WEBHOOK_SECRET!

function getPeriodEnd(sub: any): string | null {
  const ts = sub?.current_period_end || sub?.items?.data?.[0]?.current_period_end
  if (!ts) return null
  return new Date(ts * 1000).toISOString()
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[Webhook] signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[Webhook] received event:', event.type, event.id)

  const admin = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)

  // Fire-and-forget: purge events older than 7 days (Stripe's max retry window is ~72 h)
  admin.from('stripe_events').delete().lt(
    'processed_at',
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  )

  // Claim the event atomically before processing.
  // A replayed or retried delivery hits the primary key constraint (23505) here
  // and is returned 200 without re-executing any profile writes.
  const { error: claimError } = await admin
    .from('stripe_events')
    .insert({ event_id: event.id, event_type: event.type })

  if (claimError) {
    if (claimError.code === '23505') {
      console.log('[Webhook] duplicate event skipped:', event.id, event.type)
      return NextResponse.json({ received: true })
    }
    // Transient DB error — return 500 so Stripe retries; don't process without dedup guarantee
    console.error('[Webhook] failed to claim event:', event.id, claimError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  try {
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as any
      const customerId = sub.customer as string
      const periodEnd = getPeriodEnd(sub)
      const cancelled = sub.cancel_at_period_end === true

      if (!periodEnd) {
        console.warn('[Webhook] no period end found in subscription, skipping')
        return NextResponse.json({ received: true })
      }

      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile) {
        console.warn('[Webhook] no profile found for customer:', customerId)
        return NextResponse.json({ received: true })
      }

      const updates: any = {
        current_period_end: periodEnd,
        subscription_status: cancelled ? 'canceling' : 'active',
      }
      if (cancelled) {
        updates.cancelled_at = new Date().toISOString()
      } else {
        updates.cancelled_at = null
        updates.cancel_at_period_end = false
      }

      await admin.from('profiles').update(updates).eq('id', profile.id)
      console.log('[Webhook] subscription updated for profile:', profile.id, updates)
    }

    else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as any
      const customerId = sub.customer as string

      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile) {
        console.warn('[Webhook] no profile found for customer:', customerId)
        return NextResponse.json({ received: true })
      }

      await admin.from('profiles').update({
        plan: 'free',
        subscription_status: 'expired',
        current_period_end: null,
      }).eq('id', profile.id)
      console.log('[Webhook] subscription expired for profile:', profile.id)
    }

    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any
      const customerId = invoice.customer as string

      if (!invoice.subscription) {
        return NextResponse.json({ received: true })
      }

      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string) as any
      const periodEnd = getPeriodEnd(sub)

      if (!periodEnd) {
        console.warn('[Webhook] no period end on renewal, skipping')
        return NextResponse.json({ received: true })
      }

      const { data: profile } = await admin
        .from('profiles')
        .select('id, plan')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile) return NextResponse.json({ received: true })

      // Preserve existing plan tier — a premium subscriber renewing should stay premium.
      const renewedPlan = profile.plan === 'premium' ? 'premium' : 'pro'

      await admin.from('profiles').update({
        plan: renewedPlan,
        subscription_status: 'active',
        current_period_end: periodEnd,
        cancelled_at: null,
        grace_period_ends_at: null,
        stripe_subscription_id: invoice.subscription as string,
      }).eq('id', profile.id)
      console.log('[Webhook] payment succeeded, renewed profile:', profile.id)
    }

    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any
      const customerId = invoice.customer as string

      // Only act on subscription invoices (not one-time charges)
      if (!invoice.subscription) return NextResponse.json({ received: true })

      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile) return NextResponse.json({ received: true })

      const graceEnd = new Date(Date.now() + 3 * 86400000).toISOString()
      await admin.from('profiles').update({
        subscription_status: 'past_due',
        grace_period_ends_at: graceEnd,
      }).eq('id', profile.id)
      console.log('[Webhook] payment failed, grace period set for profile:', profile.id)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Webhook] handler error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
