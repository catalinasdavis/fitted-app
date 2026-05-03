import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// In-memory rate limiter — sufficient for single-instance Vercel.
// Replace with Upstash Redis before horizontal scale-out.
const WINDOW_MS  = 15 * 60 * 1000 // 15 minutes
const MAX_HITS   = 5

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
  const now  = Date.now()
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

export async function POST(request: NextRequest) {
  try {
    const ip = getIP(request)
    const { allowed, remaining } = checkRateLimit(ip)

    if (!allowed) {
      console.warn(`[Auth] rate limit hit ip=${ip}`)
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

    const { email, password, mode } = await request.json()

    console.log(`[Auth] attempt ip=${ip} mode=${mode ?? 'login'} email=${email} remaining=${remaining}`)

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const endpoint = mode === 'signup'
      ? `${SUPABASE_URL}/auth/v1/signup`
      : `${SUPABASE_URL}/auth/v1/token?grant_type=password`

    const res  = await fetch(endpoint, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    // Supabase error formats
    if (data.error || data.error_description || data.msg) {
      const msg = data.error_description || data.error_description || data.msg || data.error || 'Something went wrong.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Sign-up: Supabase may return user but no access_token if email confirmation is ON
    if (mode === 'signup') {
      if (!data.access_token) {
        // Email confirmation is enabled — user created but not yet confirmed
        return NextResponse.json({
          error: 'Check your email to confirm your account, then sign in.',
          needsConfirmation: true,
        }, { status: 200 })
      }
    }

    const token = data.access_token
    if (!token) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('fitted-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return response

  } catch (err: any) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
