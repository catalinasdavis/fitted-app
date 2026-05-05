import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY!
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Tighter rate limit — Sonnet calls are expensive
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_HITS  = 5

interface RateEntry { count: number; windowStart: number }
const ratemap = new Map<string, RateEntry>()

function getIP(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const e = ratemap.get(ip)
  if (!e || now - e.windowStart >= WINDOW_MS) {
    ratemap.set(ip, { count: 1, windowStart: now })
    return true
  }
  if (e.count >= MAX_HITS) return false
  e.count++
  return true
}

async function getUserFromCookie(req: NextRequest) {
  const token = req.cookies.get('fitted-token')?.value
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? { ...(await res.json()), token } : null
}

async function getResume(token: string, userId: string, resumeId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/resumes?id=eq.${encodeURIComponent(resumeId)}&user_id=eq.${encodeURIComponent(userId)}&select=id,name,resume_text`,
    { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] ?? null
}

async function getProfile(token: string, userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=plan`,
    { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] ?? null
}

const SYSTEM = `You are a career AI assistant. You return only valid JSON — no markdown, no code fences, no explanation before or after, no conversational text. Just the raw JSON object exactly as specified.`

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getIP(req))) {
    return NextResponse.json({ error: 'Rate limit reached. You can run 5 optimizations per hour.' }, { status: 429 })
  }

  const user = await getUserFromCookie(req)
  if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { resumeId, jdText } = body ?? {}

  if (!resumeId || typeof resumeId !== 'string') {
    return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 })
  }
  if (!jdText || typeof jdText !== 'string' || jdText.trim().length < 50) {
    return NextResponse.json({ error: 'Job description too short (minimum 50 characters)' }, { status: 400 })
  }

  const [resume, profile] = await Promise.all([
    getResume(user.token, user.id, resumeId),
    getProfile(user.token, user.id),
  ])

  if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })

  const isPro   = profile?.plan === 'pro'
  const model   = isPro ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001'
  const count   = isPro ? 5 : 2
  const resumeText = resume.resume_text.substring(0, 4000)
  const jd         = jdText.trim().substring(0, 3000)

  const prompt = `You are fitted., a candid career coach and former hiring manager. Analyze this resume against the job description and give honest, specific optimization advice.

CRITICAL RULES:
- "before" must be exact text that EXISTS in the resume (word for word), or "Missing: [gap description]" if the element doesn't exist
- "after" must be realistic and pasteable — not aspirational fiction the candidate can't back up
- "why" must be specific to this resume and this role — never generic advice
- Scores represent likelihood of passing ATS/first-screen (calibrated: 40 = weak, 60 = average, 75 = strong, 85+ = exceptional)

Resume ("${resume.name}"):
${resumeText}

Job Description:
${jd}

Return ONLY valid JSON with no other text:
{
  "scoreBefore": <number 35–85, honest assessment of current resume vs this JD>,
  "scoreAfter": <number, scoreBefore + 5–22 after applying all suggestions>,
  "summary": "<2–3 sentences. Lead with the biggest strength. Name the most critical gap. Close with the one change that makes the biggest difference. Candid, warm, direct — like a mentor who has read thousands of resumes.>",
  "suggestions": [
    {
      "section": "<exact section name from resume>",
      "type": "<bullet_rewrite | keyword_add | reorder | tone_shift>",
      "impact": "<high | medium | low>",
      "before": "<exact current text or 'Missing: [gap]'>",
      "after": "<improved version, ready to copy>",
      "why": "<specific reason referencing this resume and this company/role>"
    }
  ],
  "keywordsFound": ["<terms already in resume that match the JD>"],
  "keywordsMissing": ["<important JD terms not in resume — realistic ones the candidate could honestly add>"]
}

Return exactly ${count} suggestions, prioritized by impact (highest first).`

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
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const text = (data.content?.[0]?.text || '').replace(/```json|```/g, '').trim()
    const s = text.indexOf('{'); const e = text.lastIndexOf('}')
    if (s === -1 || e === -1) throw new Error('No JSON in response')

    const result = JSON.parse(text.substring(s, e + 1))
    return NextResponse.json({ ...result, resumeName: resume.name, isPro })
  } catch (err) {
    console.error('[optimize] error:', err)
    return NextResponse.json({ error: 'Optimization failed. Please try again.' }, { status: 500 })
  }
}
