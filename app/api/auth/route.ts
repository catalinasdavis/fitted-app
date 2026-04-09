import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password, mode } = await request.json()

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
