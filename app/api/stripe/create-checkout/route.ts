import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia' as any,
})

const PRICE_IDS: Record<string, string> = {
  monthly:     process.env.STRIPE_MONTHLY_PRICE_ID!,
  annual:      process.env.STRIPE_ANNUAL_PRICE_ID!,
  resume_slot: process.env.STRIPE_EXTRA_SLOT_PRICE_ID!,
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    if (type === 'portal') {
      const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
      )
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (!profile?.stripe_customer_id) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: APP_URL,
      })
      return NextResponse.json({ url: session.url })
    }

    if (!type || !PRICE_IDS[type]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
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
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
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
    const type      = searchParams.get('type')

    if (!sessionId || !uid) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    if (type === 'monthly' || type === 'annual') {
      await adminSupabase
        .from('profiles')
        .update({
          plan: 'pro',
          stripe_customer_id: session.customer as string,
        })
        .eq('id', uid)
    } else if (type === 'resume_slot') {
      const { data: p } = await adminSupabase
        .from('profiles')
        .select('extra_resume_slot')
        .eq('id', uid)
        .single()
      const current = p?.extra_resume_slot || 0
      await adminSupabase
        .from('profiles')
        .update({ extra_resume_slot: current + 1 })
        .eq('id', uid)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Stripe verify error:', err)
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
