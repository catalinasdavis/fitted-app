import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_HITS  = 5

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
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=plan,career_field,career_stage`,
    { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] ?? null
}

const SYSTEM = `You are a career AI assistant. Return only valid JSON — no markdown, no code fences, no text before or after. Just the raw JSON object.`

function gradeFromScore(n: number): string {
  if (n >= 93) return 'A+'
  if (n >= 90) return 'A'
  if (n >= 87) return 'A−'
  if (n >= 83) return 'B+'
  if (n >= 80) return 'B'
  if (n >= 77) return 'B−'
  if (n >= 73) return 'C+'
  if (n >= 70) return 'C'
  if (n >= 67) return 'C−'
  if (n >= 63) return 'D+'
  if (n >= 60) return 'D'
  return 'D−'
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getIP(req))) {
    return NextResponse.json({ error: 'Rate limit reached. You can run 5 health checks per hour.' }, { status: 429 })
  }

  const user = await getUserFromCookie(req)
  if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { resumeId } = body ?? {}
  if (!resumeId || typeof resumeId !== 'string') {
    return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 })
  }

  const [resume, profile] = await Promise.all([
    getResume(user.token, user.id, resumeId),
    getProfile(user.token, user.id),
  ])

  if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })

  const resumeText = resume.resume_text?.trim() ?? ''
  if (resumeText.length < 100) {
    return NextResponse.json({ error: 'Resume text is too short to analyze. Try re-uploading the file.' }, { status: 400 })
  }

  const isPro    = profile?.plan === 'pro'
  const model    = isPro ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001'
  const field    = profile?.career_field ? `Career field: ${profile.career_field}` : ''
  const stage    = profile?.career_stage ? `Career stage: ${profile.career_stage}` : ''

  const prompt = `You are fitted., a candid career coach who has reviewed thousands of resumes. Evaluate this resume honestly — like a trusted mentor, not a grading rubric. Be specific to what's actually in the text. Never invent content that isn't there.

${field}${stage ? '\n' + stage : ''}

Resume ("${resume.name}"):
${resumeText.substring(0, 4500)}

Score calibration:
- 88–100: Would get interviews at top companies. Rare.
- 75–87: Solid resume with clear strengths. Some fixable gaps.
- 60–74: Average. Passes ATS but won't stand out in a competitive pool.
- 45–59: Needs significant work before serious applications.
- Below 45: Major structural or content issues.

Return ONLY valid JSON:
{
  "score": <integer 35–95, honest and calibrated>,
  "summary": "<2–3 sentences. What would a hiring manager notice in the first 10 seconds? Lead with the most important strength. Name the single most critical weakness. Sound like a trusted senior colleague, not a rubric. Never use 'impressive' or 'great' unless truly exceptional.>",
  "strengths": [
    "<specific strength visible in this resume — cite actual content>",
    "<second strength>",
    "<third strength>"
  ],
  "blindspots": [
    {
      "issue": "<specific problem — reference actual content or absence of it>",
      "severity": "high" or "medium",
      "fix": "<concrete single action — what to write, add, or remove>"
    },
    { "issue": "...", "severity": "...", "fix": "..." },
    { "issue": "...", "severity": "...", "fix": "..." },
    { "issue": "...", "severity": "...", "fix": "..." }
  ],
  "dimensions": [
    { "label": "Impact & Results",       "score": <integer 30–95>, "note": "<one specific observation>" },
    { "label": "Clarity & Scannability", "score": <integer 30–95>, "note": "<one specific observation>" },
    { "label": "Language & Verbs",       "score": <integer 30–95>, "note": "<one specific observation>" },
    { "label": "Career Narrative",       "score": <integer 30–95>, "note": "<one specific observation>" },
    { "label": "Positioning",            "score": <integer 30–95>, "note": "<one specific observation>" }
  ],
  "quickWins": [
    "<single actionable change — specific enough to act on today>",
    "<second quick win>",
    "<third quick win>",
    "<fourth quick win>",
    "<fifth quick win>"
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
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data  = await res.json()
    const text  = (data.content?.[0]?.text || '').replace(/```json|```/g, '').trim()
    const s = text.indexOf('{'); const e = text.lastIndexOf('}')
    if (s === -1 || e === -1) throw new Error('No JSON in response')

    const result = JSON.parse(text.substring(s, e + 1))
    const score  = typeof result.score === 'number' ? Math.max(0, Math.min(100, result.score)) : 60

    return NextResponse.json({
      score,
      grade:      gradeFromScore(score),
      summary:    result.summary     || '',
      strengths:  Array.isArray(result.strengths)  ? result.strengths.slice(0, 3)  : [],
      blindspots: Array.isArray(result.blindspots) ? result.blindspots.slice(0, 4) : [],
      dimensions: Array.isArray(result.dimensions) ? result.dimensions.slice(0, 5) : [],
      quickWins:  Array.isArray(result.quickWins)  ? result.quickWins.slice(0, 5)  : [],
      resumeName: resume.name,
      isPro,
    })
  } catch (err) {
    console.error('[resume-health] error:', err)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
