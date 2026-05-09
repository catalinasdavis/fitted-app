import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const WINDOW_MS = 60 * 60 * 1000
const MAX_HITS  = 10

interface RateEntry { count: number; windowStart: number }
const ratemap = new Map<string, RateEntry>()

function getIP(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || 'unknown'
}
function checkRateLimit(ip: string): boolean {
  const now = Date.now(); const e = ratemap.get(ip)
  if (!e || now - e.windowStart >= WINDOW_MS) { ratemap.set(ip, { count: 1, windowStart: now }); return true }
  if (e.count >= MAX_HITS) return false
  e.count++; return true
}

async function getUserFromCookie(req: NextRequest) {
  const token = req.cookies.get('fitted-token')?.value
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? { ...(await res.json()), token } : null
}

async function getProfile(token: string, userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=plan,career_field,career_stage,about_me,locations,pay_target`,
    { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const rows = await res.json(); return rows[0] ?? null
}

async function getActiveResume(token: string, userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/resumes?user_id=eq.${encodeURIComponent(userId)}&is_active=eq.true&select=name,resume_text&limit=1`,
    { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const rows = await res.json(); return rows[0] ?? null
}

const SYSTEM = `You are fitted., a candid career mentor. Return only valid JSON — no markdown, no code fences, no text before or after.`

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getIP(req))) {
    return NextResponse.json({ error: 'Rate limit reached. Try again in an hour.' }, { status: 429 })
  }

  const user = await getUserFromCookie(req)
  if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const query: string = body?.query?.trim() ?? ''
  if (!query || query.length < 10) {
    return NextResponse.json({ error: 'Tell us a bit more about your background or goals.' }, { status: 400 })
  }
  if (query.length > 1200) {
    return NextResponse.json({ error: 'Please keep your description under 1200 characters.' }, { status: 400 })
  }

  const [profile, resume] = await Promise.all([
    getProfile(user.token, user.id),
    getActiveResume(user.token, user.id),
  ])

  const isPro     = profile?.plan === 'pro'
  const model     = isPro ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001'
  const roleCount = isPro ? 6 : 4

  const profileCtx = [
    profile?.career_field  ? `Career field: ${profile.career_field}` : '',
    profile?.career_stage  ? `Career stage: ${profile.career_stage}` : '',
    profile?.about_me      ? `About them: ${profile.about_me}` : '',
    profile?.locations?.length ? `Locations open to: ${profile.locations.join(', ')}` : '',
    profile?.pay_target    ? `Pay target: ${profile.pay_target}` : '',
  ].filter(Boolean).join('\n')

  const resumeCtx = resume?.resume_text
    ? `\nResume excerpt ("${resume.name}"):\n${resume.resume_text.substring(0, 2500)}`
    : ''

  const prompt = `You are a candid, experienced career mentor helping someone figure out realistic next career moves. You give honest, specific guidance — not generic cheerleading. You think like a hiring manager AND a career coach simultaneously.

User's background and context:
${profileCtx || '(no profile data)'}${resumeCtx}

What the user wants to explore:
"${query}"

Tag definitions (use exactly these strings):
- "Natural Next Step" — a logical promotion or lateral move they're already qualified for; low friction, high confidence
- "Good Transition Path" — realistic move requiring 1–2 skill gaps they can close in 3–6 months; common for career changers
- "Realistic Stretch" — ambitious but achievable in 12–18 months with deliberate effort; honest about difficulty

Score calibration:
- 80–95: They're already mostly qualified. A strong resume + network gets interviews now.
- 65–79: Good fit with clear, closable gaps. Would need tailored positioning.
- 50–64: Significant pivot. Doable but needs a plan (portfolio, coursework, bridge roles).
- Below 50: Don't suggest these.

Return ONLY this JSON (${roleCount} roles, ordered from highest to lowest match score):
{
  "summary": "<2 sentences — honest, specific take on their situation and what these options represent. Sound like a trusted mentor who has done this 500 times.>",
  "roles": [
    {
      "title": "<specific role title — not too generic, not too niche>",
      "tag": "<exactly one of: Natural Next Step | Good Transition Path | Realistic Stretch>",
      "matchScore": <integer 50–95>,
      "why": "<2–3 sentences. Be specific to their actual background. Name concrete things from their experience that make this a fit. Don't be vague.>",
      "skillGaps": [
        "<specific, honest gap — name the actual skill, tool, or experience missing>",
        "<second gap>",
        "<third gap if Pro, omit if would be empty>"
      ],
      "salaryRange": "<realistic range for this role, e.g. $72k–$105k — use current market data>",
      "searchQuery": "<2–4 word search term to find these jobs in a job board>"
    }
  ]
}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: isPro ? 2400 : 1600,
        system: SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Anthropic error:', res.status, err.substring(0, 200))
      return NextResponse.json({ error: 'AI service unavailable. Try again in a moment.' }, { status: 502 })
    }

    const ai   = await res.json()
    const text = ai.content?.[0]?.text ?? ''
    let parsed: { summary: string; roles: unknown[] }

    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('JSON parse fail:', text.substring(0, 300))
      return NextResponse.json({ error: 'Could not parse AI response. Try again.' }, { status: 500 })
    }

    if (!parsed?.roles?.length) {
      return NextResponse.json({ error: 'No role suggestions returned. Try rephrasing your description.' }, { status: 500 })
    }

    return NextResponse.json({ ...parsed, isPro })
  } catch (err) {
    console.error('Explore route error:', err)
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}
