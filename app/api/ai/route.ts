import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY!
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const PROMPT_MAX_FREE = 8_000
const PROMPT_MAX_PRO  = 16_000

// In-memory rate limiter — same pattern as /api/auth and /api/redeem.
// Replace with Upstash Redis before horizontal scale-out.
const WINDOW_MS = 15 * 60 * 1000
const MAX_HITS  = 20

interface RateEntry { count: number; windowStart: number }
const ratemap = new Map<string, RateEntry>()

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now   = Date.now()
  const entry = ratemap.get(ip)

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    ratemap.set(ip, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_HITS - 1 }
  }

  if (entry.count >= MAX_HITS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: MAX_HITS - entry.count }
}

const COACH_SYSTEM = `You are fitted., an AI career assistant with a unique dual perspective.

For every response you first think internally like an experienced hiring manager:
"What does the ideal candidate for this exact role look like? What skills, experience, and signals would make me excited to interview them immediately?"

Then you switch to career coach mode and give the user clear, specific, personalized advice on how to close any gap and become that ideal candidate.

Rules you always follow:
- Use all available user context: About Me, resume details, pay target, locations, and chat history.
- For match-score questions, lead with the hiring-manager lens — explain exactly what's missing — then give specific coaching: resume tweaks, keywords to add, interview framing.
- Never ask repetitive clarifying questions. Give direct, confident, actionable advice.
- Keep replies warm, encouraging, and professional. Never condescending.
- Be concise: 2-3 sentences for casual questions, more detail only when genuinely needed.`

const JSON_SYSTEM = `You are a career AI assistant. You return only valid JSON — no markdown, no code fences, no explanation before or after, no conversational text. Just the raw JSON object or array exactly as specified in the prompt. If you cannot generate the content, return the empty version of the requested structure ([] for arrays, {} for objects).`

async function getUserFromCookie(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? await res.json() : null
}

async function getProfile(token: string, userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=plan`,
    { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] || null
}

export async function POST(request: NextRequest) {
  try {
    const ip = getIP(request)
    const { allowed, remaining } = checkRateLimit(ip)

    if (!allowed) {
      console.warn(`[AI] rate limit hit ip=${ip}`)
      return NextResponse.json(
        { error: 'Too many requests. Please wait 15 minutes and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': '900',
            'X-RateLimit-Limit': String(MAX_HITS),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const user = await getUserFromCookie(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const token = request.cookies.get('fitted-token')!.value
    const profile = await getProfile(token, user.id)
    const isPro = profile?.plan === 'pro'

    const { prompt, type, userContext } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })
    }

    const promptMax = isPro ? PROMPT_MAX_PRO : PROMPT_MAX_FREE
    if (prompt.length > promptMax) {
      return NextResponse.json({ error: 'Prompt too long' }, { status: 400 })
    }

    const isJson = type === 'tailor' || type === 'standout'
    const systemPrompt = isJson ? JSON_SYSTEM : COACH_SYSTEM

    let finalPrompt = prompt
    if (type === 'chat' && userContext) {
      const ctx: string[] = []
      if (userContext.aboutMe)              ctx.push(`About Me: ${userContext.aboutMe}`)
      if (userContext.resumeNames?.length)  ctx.push(`Active resumes: ${userContext.resumeNames.join(', ')}`)
      if (userContext.payTarget)            ctx.push(`Pay target: ${userContext.payTarget}`)
      if (userContext.locations?.length)    ctx.push(`Locations: ${userContext.locations.join(', ')}`)
      if (userContext.likedJobs?.length)    ctx.push(`Jobs they liked: ${userContext.likedJobs.join(', ')}`)
      if (userContext.dislikedJobs?.length) ctx.push(`Jobs they disliked: ${userContext.dislikedJobs.join(', ')}`)
      if (ctx.length > 0) {
        finalPrompt = `[User context: ${ctx.join(' | ')}]\n\n${prompt}`
      }
    }

    const model = isPro
      ? 'claude-sonnet-4-20250514'
      : 'claude-haiku-4-5-20251001'

    const maxTokens = isJson ? 1200 : type === 'match' ? 800 : 400

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: finalPrompt }],
      }),
    })

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    if (process.env.NODE_ENV === 'development' && isJson) {
      console.log(`[fitted. AI — ${type}] raw response:`, text.substring(0, 300))
    }

    return NextResponse.json({ text })
  } catch (err: any) {
    console.error('AI route error:', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
