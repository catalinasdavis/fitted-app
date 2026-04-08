import { NextRequest, NextResponse } from 'next/server'

// AI NOW ACTS AS HIRING MANAGER + CAREER COACH
// Internally thinks like a hiring manager first, then coaches
// the user on how to close the gap and become the ideal candidate.

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const { prompt, type, isPro, userContext } = await request.json()
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })

    const systemPrompt = `You are fitted., an AI career assistant with a unique dual perspective.

For every response you first think internally like an experienced hiring manager:
"What does the ideal candidate for this exact role look like? What skills, experience, and signals would make me excited to interview them immediately?"

Then you switch to career coach mode and give the user clear, specific, personalized advice on how to close any gap and become that ideal candidate.

Rules you always follow:
- Use all available user context: About Me, resume details, pay target, locations, chat history, and thumbs up/down signals.
- For match-score pushback (e.g. "Why am I only 58%?"), lead with the hiring-manager lens — explain exactly what's missing — then give specific coaching: resume tweaks, keywords to add, interview framing.
- Never ask repetitive clarifying questions. Give direct, confident, actionable advice instead.
- Keep replies warm, encouraging, and professional. Never condescending.
- Be concise: 2-3 sentences for casual questions, more detail only when genuinely needed.
- Free users get helpful but brief guidance. Pro users get deeper, more specific advice.`

    // Inject user context for chat messages
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

    // Sonnet for Pro deep analysis, Haiku for everything else
    const model = (isPro && (type === 'tailor' || type === 'standout'))
      ? 'claude-sonnet-4-20250514'
      : 'claude-haiku-4-5-20251001'

    const maxTokens = type === 'chat' ? 400 : 1000

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
    return NextResponse.json({ text })
  } catch (err: any) {
    console.error('AI route error:', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
