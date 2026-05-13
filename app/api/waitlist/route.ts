import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

const serviceHeaders = {
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type':  'application/json',
}

export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => null)
  const email = (body?.email ?? '').trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (email.length > 255) {
    return NextResponse.json({ error: 'Email too long.' }, { status: 400 })
  }

  const ip = getIP(req)

  // Check for existing entry
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/waitlist?email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
    { headers: serviceHeaders }
  )
  if (!checkRes.ok) {
    console.error('Waitlist check error:', await checkRes.text())
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
  const existing = await checkRes.json()
  if (existing?.length > 0) {
    return NextResponse.json({ error: 'Already on the waitlist.' }, { status: 409 })
  }

  // Insert
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method:  'POST',
    headers: { ...serviceHeaders, 'Prefer': 'return=minimal' },
    body:    JSON.stringify({ email, ip }),
  })

  if (!insertRes.ok) {
    const errText = await insertRes.text()
    console.error('Waitlist insert error:', errText)
    if (errText.includes('duplicate') || errText.includes('unique')) {
      return NextResponse.json({ error: 'Already on the waitlist.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Could not join waitlist. Try again.' }, { status: 500 })
  }

  // Get total count to determine tier
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/waitlist?select=id`,
    { headers: { ...serviceHeaders, 'Prefer': 'count=exact', 'Range': '0-0' } }
  )
  const contentRange = countRes.headers.get('content-range') ?? ''
  const total = parseInt(contentRange.split('/')[1] ?? '0', 10)

  const tier = total <= 100 ? 'founding' : total <= 200 ? 'early' : 'standard'

  return NextResponse.json({ success: true, position: total, tier })
}
