import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const PRICE_IDS: Record<string, string> = {
  monthly:       process.env.STRIPE_MONTHLY_PRICE_ID!,
  annual:        process.env.STRIPE_ANNUAL_PRICE_ID!,
  resume_slot:   process.env.STRIPE_EXTRA_SLOT_PRICE_ID!,
  pro_extension: process.env.STRIPE_EXTENSION_PRICE_ID!,
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function getUserFromCookie(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!res.ok) return null
  return await res.json()
}

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()
    const user = await getUserFromCookie(request)

    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    if (type === 'portal') {
      const admin = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)
      const { data: profile } = await admin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (!profile?.stripe_customer_id) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${APP_URL}/?portal_return=1`,
      })
      return NextResponse.json({ url: session.url })
    }

    const knownTypes = ['monthly', 'annual', 'resume_slot', 'pro_extension']
    if (!type || !knownTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    if (!PRICE_IDS[type]) {
      console.error(`[Stripe POST] Price ID not configured for type: ${type}`)
      return NextResponse.json({ error: `${type} is not available yet` }, { status: 400 })
    }

    const isSubscription = type === 'monthly' || type === 'annual'

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[type], quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, type },
      success_url: `${APP_URL}/?payment=success&type=${type}&session_id={CHECKOUT_SESSION_ID}&uid=${user.id}`,
      cancel_url:  `${APP_URL}/?payment=cancelled`,
      // Promo codes only on subscription plans — extension is already discounted
      allow_promotion_codes: isSubscription,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[Stripe POST] error:', err)
    return NextResponse.json(
      { error: err.message || 'Checkout session creation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const uid       = searchParams.get('uid')

    console.log('[Stripe GET] verification request:', { sessionId, uid })

    if (!sessionId || !uid) {
      console.log('[Stripe GET] missing params')
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log('[Stripe GET] session status:', session.payment_status, 'customer:', session.customer)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    if (session.client_reference_id !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Read type from server-set metadata — never trust the URL parameter
    const type = session.metadata?.type

    const admin = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)

    if (type === 'monthly' || type === 'annual') {
      const { error } = await admin
        .from('profiles')
        .update({
          plan: 'pro',
          stripe_customer_id: session.customer as string,
        })
        .eq('id', uid)

      if (error) {
        console.error('[Stripe GET] update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Non-fatal: save subscription ID for cancel/save flow (column may not exist yet)
      if (session.subscription) {
        const { error: subErr } = await admin
          .from('profiles')
          .update({ stripe_subscription_id: session.subscription as string })
          .eq('id', uid)
        if (subErr) console.warn('[Stripe GET] stripe_subscription_id not saved:', subErr.message)
      }

      console.log('[Stripe GET] updated profile to pro for user:', uid)
    } else if (type === 'resume_slot') {
      const { error } = await admin
        .from('profiles')
        .update({ extra_resume_slot: true })
        .eq('id', uid)

      if (error) {
        console.error('[Stripe GET] update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      console.log('[Stripe GET] updated extra_resume_slot for user:', uid)
    } else if (type === 'pro_extension') {
      const extensionUntil = new Date(Date.now() + 86400000).toISOString()
      const { error } = await admin
        .from('profiles')
        .update({
          plan: 'pro',
          subscription_status: 'extended',
          current_period_end: extensionUntil,
          stripe_customer_id: session.customer as string,
        })
        .eq('id', uid)

      if (error) {
        console.error('[Stripe GET] extension update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      console.log('[Stripe GET] 24h extension applied for user:', uid)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Stripe GET] error:', err)
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
