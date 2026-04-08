import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  const { email, password, mode } = await request.json()
  // mode: 'signin' | 'signup'

  const endpoint = mode === 'signup'
    ? `${SUPABASE_URL}/auth/v1/signup`
    : `${SUPABASE_URL}/auth/v1/token?grant_type=password`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()

  if (data.error || data.error_description) {
    return NextResponse.json(
      { error: data.error_description || data.error || 'Something went wrong' },
      { status: 400 }
    )
  }

  const token = data.access_token
  if (!token) {
    return NextResponse.json({ error: 'No token returned' }, { status: 400 })
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
}
