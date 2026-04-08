import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getUser(token: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? res.json() : null
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

  // Look up code in Supabase
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(code.trim().toUpperCase())}&select=*`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
  )
  const rows = await res.json()

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Invalid code — check the spelling and try again.' }, { status: 400 })
  }

  const promo = rows[0]

  if (!promo.active) {
    return NextResponse.json({ error: 'This code is no longer active.' }, { status: 400 })
  }

  if (!promo.reusable && promo.used_count >= (promo.max_uses || 1)) {
    return NextResponse.json({ error: 'This code has already been used.' }, { status: 400 })
  }

  // Upgrade the user's plan to pro
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ plan: 'pro' }),
  })

  // Increment used_count
  await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(code.trim().toUpperCase())}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ used_count: (promo.used_count || 0) + 1 }),
  })

  return NextResponse.json({ success: true })
}
