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

  console.log('[Webhook] received event:', event.type)

  const admin = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)

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
        subscription_status: cancelled ? 'cancelled' : 'active',
      }
      if (cancelled) updates.cancelled_at = new Date().toISOString()
      else updates.cancelled_at = null

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
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile) return NextResponse.json({ received: true })

      await admin.from('profiles').update({
        plan: 'pro',
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
    // Return 200 to prevent Stripe from retrying on permanent failures.
    // The error is logged above for alerting.
    return NextResponse.json({ received: true, error: err.message })
  }
}
