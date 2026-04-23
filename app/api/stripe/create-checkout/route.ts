import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia' as any,
})

const PRICE_IDS: Record<string, string> = {
  monthly:   process.env.STRIPE_MONTHLY_PRICE_ID!,
  annual:    process.env.STRIPE_ANNUAL_PRICE_ID!,
  extraSlot: process.env.STRIPE_EXTRA_SLOT_PRICE_ID!,
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, userEmail } = await request.json()

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Missing user info' }, { status: 400 })
    }

    const isSubscription = plan === 'monthly' || plan === 'annual'

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
      success_url: `${APP_URL}/?payment=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
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
