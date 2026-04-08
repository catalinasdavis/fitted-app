import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!

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
    const formData = await request.formData()
    const file     = formData.get('resume') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const resumeText = await extractText(file)
    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ error: 'Could not extract text. Try a different format.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, resumeText, filename: file.name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 400 })
  }
}
