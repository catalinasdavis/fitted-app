import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME  = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

// In-memory rate limiter — 10 uploads per IP per hour to limit Claude vision abuse.
// Replace with Upstash Redis before horizontal scale-out.
const WINDOW_MS = 60 * 60 * 1000
const MAX_HITS  = 10

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

async function getUserFromCookie(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? await res.json() : null
}

async function extractText(file: File): Promise<string> {
  const filename  = file.name.toLowerCase()
  const mediaType = file.type
  const bytes     = await file.arrayBuffer()

  // Plain text
  if (mediaType === 'text/plain' || filename.endsWith('.txt')) {
    return await file.text()
  }

  // DOCX — extract from XML
  if (filename.endsWith('.docx') || mediaType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const JSZip = (await import('jszip')).default
      const zip   = await JSZip.loadAsync(bytes)
      const xml   = await zip.file('word/document.xml')?.async('string') || ''
      return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    } catch {
      throw new Error('Could not read DOCX file. Try saving as PDF.')
    }
  }

  // PDF and images — use Claude vision
  if (mediaType === 'application/pdf' || mediaType.startsWith('image/')) {
    const base64 = Buffer.from(bytes).toString('base64')
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            mediaType === 'application/pdf'
              ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
              : { type: 'image',    source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Extract all text from this resume exactly as written. Preserve structure — name, contact, summary, experience, education, skills. Return only the extracted text, no commentary.' }
          ]
        }]
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text || ''
  }

  throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.')
}

export async function POST(request: NextRequest) {
  try {
    const ip = getIP(request)
    const { allowed, remaining } = checkRateLimit(ip)

    if (!allowed) {
      console.warn(`[Resume] rate limit hit ip=${ip}`)
      return NextResponse.json(
        { error: 'Too many uploads. Please wait an hour and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': '3600',
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

    const formData = await request.formData()
    const file     = formData.get('resume') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 400 })
    }

    const ext = file.name.toLowerCase().split('.').pop()
    // Extension fallback only when the browser sends no MIME type (empty string).
    // A non-empty, non-allowed MIME is rejected even if the extension looks right —
    // this prevents the bypass where file.type='image/jpeg' + file.name='resume.pdf' would pass.
    const mimeOk = ALLOWED_MIME.has(file.type) || (!file.type && (ext === 'txt' || ext === 'pdf' || ext === 'docx'))
    if (!mimeOk) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF, DOCX, or TXT.' }, { status: 400 })
    }

    const resumeText = await extractText(file)
    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ error: 'Could not extract text. Try a different format.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, resumeText, filename: file.name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 400 })
  }
}
