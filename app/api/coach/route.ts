import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!

interface CoachMemory {
  summary?:           string
  lastSeenAt?:        string
  nudgeDismissedAt?:  string | null
  actionCount?:       { saved: number; applied: number; tailored: number; healthChecked: number }
  checkpointAt?:      string
}

async function getUserFromCookie(req: NextRequest) {
  const token = req.cookies.get('fitted-token')?.value
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? { ...(await res.json()), token } : null
}

async function getMemory(token: string, userId: string): Promise<CoachMemory> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=coach_memory`,
    { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return {}
  const rows = await res.json()
  return (rows[0]?.coach_memory as CoachMemory) ?? {}
}

async function saveMemory(token: string, userId: string, memory: CoachMemory) {
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ coach_memory: memory }),
  })
}

async function generateNudge(memory: CoachMemory, daysSince: number, profile: { career_field?: string; career_stage?: string } | null): Promise<string> {
  const counts = memory.actionCount ?? { saved: 0, applied: 0, tailored: 0, healthChecked: 0 }
  const context = [
    memory.summary ? `Coach notes: ${memory.summary}` : '',
    profile?.career_field ? `Career field: ${profile.career_field}` : '',
    profile?.career_stage ? `Career stage: ${profile.career_stage}` : '',
    `Days since last visit: ${daysSince}`,
    `Jobs saved: ${counts.saved}, applied: ${counts.applied}, tailored: ${counts.tailored}`,
  ].filter(Boolean).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: 'You are a calm, thoughtful career mentor. Write one short, warm sentence welcoming the user back and noting something specific about their job search — not generic encouragement. No exclamation marks. No emoji. Sound like a trusted colleague, not a motivational poster.',
      messages: [{ role: 'user', content: `User context:\n${context}\n\nWrite the welcome-back nudge.` }],
    }),
  })
  const data = await res.json()
  return (data.content?.[0]?.text || '').trim()
}

async function synthesizeMemory(
  memory: CoachMemory,
  event: string,
  data: Record<string, unknown>,
  profile: { career_field?: string; career_stage?: string; about_me?: string } | null
): Promise<string> {
  const existing = memory.summary || 'No coaching notes yet.'
  const context = [
    profile?.career_field ? `Career field: ${profile.career_field}` : '',
    profile?.career_stage ? `Career stage: ${profile.career_stage}` : '',
    profile?.about_me     ? `About: ${String(profile.about_me).substring(0, 300)}` : '',
  ].filter(Boolean).join(' | ')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system: 'You are a career coach AI maintaining a short internal note about a job seeker. Update the existing note with what you observe from the new signal. Keep it under 2 sentences. Focus on patterns and goals, not events. Return only the updated note text — no labels, no preamble.',
      messages: [{
        role: 'user',
        content: `Existing note: "${existing}"\nProfile: ${context}\nNew signal: ${event} — ${JSON.stringify(data)}\n\nUpdated note:`,
      }],
    }),
  })
  const d = await res.json()
  return (d.content?.[0]?.text || existing).trim()
}

// GET — return memory + nudge if applicable, update lastSeenAt
export async function GET(req: NextRequest) {
  const user = await getUserFromCookie(req)
  if (!user?.id) return NextResponse.json({ memory: null, nudge: null })

  const [memory, profileRes] = await Promise.all([
    getMemory(user.token, user.id),
    fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=career_field,career_stage`, {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${user.token}` },
    }).then(r => r.json()).then(rows => rows[0] ?? null).catch(() => null),
  ])

  const now = new Date()
  const lastSeen = memory.lastSeenAt ? new Date(memory.lastSeenAt) : null
  const daysSince = lastSeen ? Math.floor((now.getTime() - lastSeen.getTime()) / 86400000) : 99
  const dismissedAt = memory.nudgeDismissedAt ? new Date(memory.nudgeDismissedAt) : null
  const daysSinceDismiss = dismissedAt ? Math.floor((now.getTime() - dismissedAt.getTime()) / 86400000) : 99

  // Only nudge if away ≥ 3 days and not dismissed within 7 days
  const shouldNudge = daysSince >= 3 && daysSinceDismiss >= 7

  let nudge: string | null = null
  if (shouldNudge) {
    try { nudge = await generateNudge(memory, daysSince, profileRes) } catch { /* non-fatal */ }
  }

  // Update lastSeenAt in background (don't await in response)
  const updated: CoachMemory = { ...memory, lastSeenAt: now.toISOString() }
  saveMemory(user.token, user.id, updated).catch(() => {})

  return NextResponse.json({ memory: updated, nudge })
}

// PATCH — record a signal or dismiss nudge
export async function PATCH(req: NextRequest) {
  const user = await getUserFromCookie(req)
  if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const memory = await getMemory(user.token, user.id)

  // Nudge dismissal
  if (body.action === 'dismiss') {
    await saveMemory(user.token, user.id, { ...memory, nudgeDismissedAt: new Date().toISOString() })
    return NextResponse.json({ success: true })
  }

  // Record a signal event
  const { event, data = {} } = body as { event?: string; data?: Record<string, unknown> }
  if (!event) return NextResponse.json({ error: 'Missing event' }, { status: 400 })

  // Update action counters
  const counts = memory.actionCount ?? { saved: 0, applied: 0, tailored: 0, healthChecked: 0 }
  if (event === 'job_saved')      counts.saved++
  if (event === 'job_applied')    counts.applied++
  if (event === 'tailor_run')     counts.tailored++
  if (event === 'health_checked') counts.healthChecked++
  const totalActions = counts.saved + counts.applied + counts.tailored + counts.healthChecked

  // Synthesize memory summary every 5 actions or if checkpoint > 7 days old
  const checkpointAt   = memory.checkpointAt ? new Date(memory.checkpointAt) : null
  const daysSinceCheck = checkpointAt ? Math.floor((Date.now() - checkpointAt.getTime()) / 86400000) : 99
  const shouldSynth    = totalActions % 5 === 0 || daysSinceCheck >= 7

  let summary = memory.summary
  if (shouldSynth) {
    try {
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=career_field,career_stage,about_me`,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${user.token}` } }
      ).then(r => r.json()).then(rows => rows[0] ?? null).catch(() => null)
      summary = await synthesizeMemory(memory, event, data, profileRes)
    } catch { /* non-fatal */ }
  }

  const updated: CoachMemory = {
    ...memory,
    summary,
    actionCount:   counts,
    checkpointAt:  shouldSynth ? new Date().toISOString() : (memory.checkpointAt ?? new Date().toISOString()),
    lastSeenAt:    memory.lastSeenAt ?? new Date().toISOString(),
  }

  await saveMemory(user.token, user.id, updated)
  return NextResponse.json({ success: true })
}
