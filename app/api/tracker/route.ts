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
  if (!token) return NextResponse.json({ entries: [] })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ entries: [] })

  // Auto-purge entries deleted more than 14 days ago
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  await fetch(
    `${SUPABASE_URL}/rest/v1/tracker?user_id=eq.${user.id}&deleted_at=lte.${cutoff}`,
    { method: 'DELETE', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
  )

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tracker?user_id=eq.${user.id}&order=added_at.desc`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
  )
  const entries = await res.json()
  return NextResponse.json({ entries: Array.isArray(entries) ? entries : [] })
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await request.json()
  const { job_id, job_title, job_company, job_logo, job_logo_bg, job_logo_color, job_pay, job_url, column_id, resume_name } = body

  // Check if entry already exists — restore if trashed
  const existing = await fetch(
    `${SUPABASE_URL}/rest/v1/tracker?user_id=eq.${user.id}&job_id=eq.${job_id}`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
  )
  const existingRows = await existing.json()

  if (Array.isArray(existingRows) && existingRows.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/tracker?id=eq.${existingRows[0].id}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ column_id, deleted_at: null }),
    })
    return NextResponse.json({ success: true })
  }

  await fetch(`${SUPABASE_URL}/rest/v1/tracker`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      user_id: user.id,
      job_id, job_title, job_company, job_logo, job_logo_bg, job_logo_color,
      job_pay, job_url, column_id: column_id || 'saved',
      resume_name: resume_name || null,
      deleted_at: null,
    }),
  })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { id, column_id, notes, deleted_at, restore } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const payload: any = {}
  if (column_id  !== undefined) payload.column_id  = column_id
  if (notes      !== undefined) payload.notes       = notes
  if (deleted_at !== undefined) payload.deleted_at  = deleted_at
  if (restore)                  payload.deleted_at  = null

  await fetch(`${SUPABASE_URL}/rest/v1/tracker?id=eq.${id}&user_id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(payload),
  })
  return NextResponse.json({ success: true })
}
