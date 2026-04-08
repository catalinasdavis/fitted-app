import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getUser(token: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? res.json() : null
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ profile: null })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ profile: null })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
  )
  const rows = await res.json()
  return NextResponse.json({ profile: rows[0] || null })
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await request.json()
  const allowed = ['career_field', 'career_stage', 'priority', 'about_me', 'locations', 'pay_target', 'portfolio_files']
  const payload: any = {}
  allowed.forEach(f => { if (body[f] !== undefined) payload[f] = body[f] })

  const existing = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
  )
  const rows = await existing.json()

  if (!Array.isArray(rows) || rows.length === 0) {
    payload.id    = user.id
    payload.email = user.email
    payload.plan  = 'free'
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload),
    })
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload),
    })
  }
  return NextResponse.json({ success: true })
}
