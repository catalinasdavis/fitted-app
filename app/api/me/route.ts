import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ user: null })

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!res.ok) return NextResponse.json({ user: null })
  const user = await res.json()
  return NextResponse.json({ user })
}
