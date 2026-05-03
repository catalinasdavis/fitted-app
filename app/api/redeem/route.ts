import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// In-memory rate limiter — same pattern as /api/auth.
// Replace with Upstash Redis before horizontal scale-out.
const WINDOW_MS = 15 * 60 * 1000
const MAX_HITS  = 5

interface RateEntry { count: number; windowStart: number }
const ratemap = new Map<string, RateEntry>()

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now   = Date.now()
  const entry = ratemap.get(ip)

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    ratemap.set(ip, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_HITS - 1 }
  }

  if (entry.count >= MAX_HITS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: MAX_HITS - entry.count }
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
  const { allowed, remaining } = checkRateLimit(ip)

  if (!allowed) {
    console.warn(`[Redeem] rate limit hit ip=${ip}`)
    return NextResponse.json(
      { error: 'Too many attempts. Please wait 15 minutes and try again.' },
      {
        status: 429,
        headers: {
          'Retry-After': '900',
          'X-RateLimit-Limit': String(MAX_HITS),
          'X-RateLimit-Remaining': '0',
        },
      }
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
  console.log(`[Redeem] attempt ip=${ip} userId=${user.id} code=${normalized} remaining=${remaining}`)

  // Fetch promo code via service role.
  // Schema requirement: promo_codes must have a redeemed_by UUID[] column
  // (DEFAULT '{}') to track per-user deduplication.
  //   ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS redeemed_by UUID[] NOT NULL DEFAULT '{}';
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(normalized)}&select=*`,
    { headers: { 'apikey': SUPABASE_SERVICE, 'Authorization': `Bearer ${SUPABASE_SERVICE}` } }
  )
  const rows = await res.json()

  // All validation failures return the same generic message to prevent enumeration
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`[Redeem] rejected code=${normalized} reason=not_found`)
    return NextResponse.json({ error: INVALID_MSG }, { status: 400 })
  }

  const promo = rows[0]

  if (!promo.active) {
    console.log(`[Redeem] rejected code=${normalized} reason=inactive`)
    return NextResponse.json({ error: INVALID_MSG }, { status: 400 })
  }

  if (!promo.reusable && promo.used_count >= (promo.max_uses || 1)) {
    console.log(`[Redeem] rejected code=${normalized} reason=exhausted`)
    return NextResponse.json({ error: INVALID_MSG }, { status: 400 })
  }

  // Per-user dedup: reject if this user has already redeemed this code
  const redeemedBy: string[] = promo.redeemed_by || []
  if (redeemedBy.includes(user.id)) {
    console.log(`[Redeem] rejected code=${normalized} reason=already_redeemed userId=${user.id}`)
    return NextResponse.json({ error: INVALID_MSG }, { status: 400 })
  }

  // Upgrade plan via service role
  const upRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ plan: 'pro' }),
  })

  if (!upRes.ok) {
    console.error('[Redeem] profile upgrade failed:', await upRes.text())
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 })
  }

  // Record redemption: increment used_count and append user to redeemed_by
  await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(normalized)}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      used_count: (promo.used_count || 0) + 1,
      redeemed_by: [...redeemedBy, user.id],
    }),
  })

  console.log(`[Redeem] success code=${normalized} userId=${user.id}`)
  return NextResponse.json({ success: true })
}
