import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '../../../lib/rate-limit'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

async function getUser(token: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? res.json() : null
}

// Generic rejection message — identical wording for every validation failure
// so callers cannot distinguish "wrong code" from "already used" from "inactive".
const INVALID_MSG = 'Invalid or unavailable code.'

export async function POST(request: NextRequest) {
  const ip = getIP(request)
  const { allowed, retryAfterSecs } = rateLimit('redeem-ip', ip, 5, 15 * 60 * 1000)

  if (!allowed) {
    console.warn(`[Redeem] rate limit hit ip=${ip}`)
    return NextResponse.json(
      { error: 'Too many attempts. Please wait 15 minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } }
    )
  }

  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { code } = await request.json()
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  const normalized = code.trim().toUpperCase()
  console.log(`[Redeem] attempt ip=${ip} userId=${user.id} code=${normalized}`)

  // Single atomic RPC — validation, promo increment, and profile upgrade all happen
  // in one transaction under a row-level lock. Eliminates the TOCTOU race.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/redeem_promo_code`, {
    method: 'POST',
    headers: {
      'apikey':        SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ p_code: normalized, p_user_id: user.id }),
  })

  if (!res.ok) {
    console.error('[Redeem] RPC error:', res.status, await res.text())
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 })
  }

  const result = await res.json() as { ok: boolean; reason?: string }

  if (!result.ok) {
    console.log(`[Redeem] rejected code=${normalized} reason=${result.reason} userId=${user.id}`)
    return NextResponse.json({ error: INVALID_MSG }, { status: 400 })
  }

  console.log(`[Redeem] success code=${normalized} userId=${user.id}`)
  return NextResponse.json({ success: true })
}
