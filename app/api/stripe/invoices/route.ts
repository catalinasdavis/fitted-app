import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getUserFromCookie(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })
  return res.ok ? await res.json() : null
}

export async function GET(request: NextRequest) {
  const user = await getUserFromCookie(request)
  if (!user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ invoices: [] })
  }

  try {
    const list = await stripe.invoices.list({
      customer: profile.stripe_customer_id,
      limit: 24,
      status: 'paid',
    })

    const invoices = list.data.map(inv => ({
      id: inv.id,
      amount: inv.amount_paid,
      currency: inv.currency,
      date: inv.created,
      description: inv.lines.data[0]?.description || 'fitted. Pro',
      url: inv.hosted_invoice_url,
      pdf: inv.invoice_pdf,
    }))

    return NextResponse.json({ invoices })
  } catch (err: any) {
    console.error('[Invoices] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
