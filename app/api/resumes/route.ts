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
  if (!token) return NextResponse.json({ resumes: [] })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ resumes: [] })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/resumes?user_id=eq.${user.id}&order=created_at.desc`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
  )
  const resumes = await res.json()
  return NextResponse.json({ resumes: Array.isArray(resumes) ? resumes : [] })
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { name, filename, resume_text } = await request.json()
  if (!name || !filename || !resume_text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // First resume is auto-set active
  const existing = await fetch(
    `${SUPABASE_URL}/rest/v1/resumes?user_id=eq.${user.id}&select=id`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` } }
  )
  const existingRows = await existing.json()
  const isFirst = !Array.isArray(existingRows) || existingRows.length === 0

  const res = await fetch(`${SUPABASE_URL}/rest/v1/resumes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ user_id: user.id, name, filename, resume_text, is_active: isFirst }),
  })
  const data = await res.json()
  return NextResponse.json({ success: true, resume: Array.isArray(data) ? data[0] : data })
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { id, name, is_active } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // MULTIPLE ACTIVE RESUMES — toggle independently, never deactivate others
  const payload: any = {}
  if (name !== undefined) payload.name = name
  if (is_active !== undefined) payload.is_active = is_active

  await fetch(`${SUPABASE_URL}/rest/v1/resumes?id=eq.${id}&user_id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(payload),
  })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const user = await getUser(token)
  if (!user?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await fetch(`${SUPABASE_URL}/rest/v1/resumes?id=eq.${id}&user_id=eq.${user.id}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` },
  })
  return NextResponse.json({ success: true })
}
