'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Job } from '../../../lib/jobs'

interface Profile { plan: string; about_me: string | null; career_field: string | null; career_stage: string | null; pay_target: string | null; subscription_status?: string | null; current_period_end?: string | null; ai_prefs?: { autoMatch?: boolean; autoTailor?: boolean; autoStandout?: boolean; autoInterviewPrep?: boolean } | null }
interface Resume { id: string; name: string; resume_text: string; is_active: boolean }
interface User { email: string; id: string }
interface TrackerEntry { id: string; job_id: string; column_id: string; notes: string; deleted_at: string | null }

function mc(n: number) {
  if (n >= 74) return '#1a7a4a'
  if (n >= 62) return '#2d5be3'
  if (n >= 50) return '#b8750a'
  return '#7a7a85'
}

function renderAI(text: string) {
  if (!text) return null
  return (
    <div>
      {text.split('\n').filter(l => l.trim()).map((line, i) => {
        const heading = line.trim().match(/^\*\*(.+?)\*\*\s*$/)
        if (heading) return (
          <p key={i} style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1f', margin: i === 0 ? '0 0 6px' : '18px 0 6px' }}>
            {heading[1]}
          </p>
        )
        const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: html }}
            style={{ fontSize: 13.5, color: '#3d3d45', lineHeight: 1.75, margin: '0 0 6px' }} />
        )
      })}
    </div>
  )
}

export default function JobDetail() {
  const params  = useParams()
  const router  = useRouter()
  const jobId   = params.id as string

  const [job,       setJob]       = useState<Job | null>(null)
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [resumes,   setResumes]   = useState<Resume[]>([])
  const [user,      setUser]      = useState<User | null>(null)
  const [tab,       setTab]       = useState<'match'|'tailor'|'standout'|'emails'|'prep'|'career'|'notes'|'rejected'>('match')
  const [dataReady, setDataReady] = useState(false)
  const [notes,     setNotes]     = useState('')
  const [showMenu,  setShowMenu]  = useState(false)

  const [matchAI,         setMatchAI]         = useState('')
  const [matchLoading,    setMatchLoading]    = useState(false)
  const matchDone = useRef(false)

  const [tailorAI,        setTailorAI]        = useState<any[]>([])
  const [tailorLoading,   setTailorLoading]   = useState(false)
  const tailorDone = useRef(false)

  const [standoutAI,      setStandoutAI]      = useState<any>(null)
  const [standoutLoading, setStandoutLoading] = useState(false)
  const standoutDone = useRef(false)

  const [coverLetter,     setCoverLetter]     = useState('')
  const [coverLoading,    setCoverLoading]    = useState(false)
  const [showCover,       setShowCover]       = useState(false)

  const [emailType,      setEmailType]      = useState<'apply'|'followup'|'thankyou'|'checkin'>('apply')
  const [prepAnswers,    setPrepAnswers]    = useState<Record<number,string>>({})
  const [prepFeedback,   setPrepFeedback]   = useState<Record<number,string>>({})
  const [prepLoading,    setPrepLoading]    = useState<Record<number,boolean>>({})
  const [prepAI,         setPrepAI]         = useState<Array<{category:string;question:string;hint:string;highlight:string}>>([])
  const [prepAILoading,  setPrepAILoading]  = useState(false)
  const prepAIDone = useRef(false)
  const [negotiateResult,  setNegotiateResult]  = useState<{targetRange:{low:number;high:number;note:string};opening:string;talkingPoints:{point:string;script:string}[];pushbacks:{scenario:string;response:string}[];counterOffer?:{script:string;floorNote:string};emailTemplate?:string} | null>(null)
  const [negotiateLoading, setNegotiateLoading] = useState(false)
  const [negotiateCopied,  setNegotiatesCopied] = useState<Record<string,boolean>>({})
  const [trackerEntries, setTrackerEntries] = useState<TrackerEntry[]>([])
  const [allJobs,        setAllJobs]        = useState<Job[]>([])
  const [notesSaveInd,   setNotesSaveInd]   = useState('')
  const [applyDone,      setApplyDone]      = useState(false)
  const notesRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Critical path: job + user context. Render as soon as these 5 resolve.
    Promise.all([
      fetch(`/api/jobs/${jobId}`).then(r => r.json()).catch(() => ({})),
      fetch('/api/me').then(r => r.json()).catch(() => ({})),
      fetch('/api/profile').then(r => r.json()).catch(() => ({})),
      fetch('/api/resumes').then(r => r.json()).catch(() => ({})),
      fetch('/api/tracker').then(r => r.json()).catch(() => ({})),
    ]).then(([jd, me, p, r, t]) => {
      setJob(jd?.job ?? null)
      if (me?.user)    setUser(me.user)
      if (p?.profile)  setProfile(p.profile)
      if (r?.resumes)  setResumes(r.resumes)
      if (t?.entries) {
        setTrackerEntries(t.entries)
        const entry = (t.entries as TrackerEntry[]).find((e: TrackerEntry) => e.job_id === jobId && !e.deleted_at)
        if (entry?.notes) setNotes(entry.notes)
      }
      setDataReady(true)
    })
    // Secondary: similar jobs sidebar — loads after page is already visible
    fetch('/api/jobs').then(r => r.json()).catch(() => ({})).then(jl => {
      if (jl?.jobs) setAllJobs(jl.jobs)
    })
  }, [jobId])

  useEffect(() => {
    if (dataReady && job && !matchDone.current && !matchLoading && profile?.ai_prefs?.autoMatch !== false) runMatch()
  }, [dataReady, job])

  function bestResume(list: Resume[]): Resume | null {
    const active = list.filter(r => r.is_active)
    if (!active.length) return null
    if (active.length === 1) return active[0]
    if (!job) return active[0]
    const words = (job.description + ' ' + ((job as any).skills?.map((s: any) => s.name).join(' ') || ''))
      .toLowerCase().split(/\W+/).filter(w => w.length > 4)
    let best = active[0]; let top = -1
    for (const r of active) {
      const score = words.filter(w => r.resume_text.toLowerCase().includes(w)).length
      if (score > top) { top = score; best = r }
    }
    return best
  }

  async function callAI(prompt: string, type: string = 'chat'): Promise<string> {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type, isPro: profile?.plan === 'pro' }),
    })
    const d = await res.json()
    return d.text || ''
  }

  async function runMatch() {
    if (matchDone.current || matchLoading || !job) return
    matchDone.current = true
    setMatchLoading(true)
    const br = bestResume(resumes)
    const resumeText = br
      ? `Resume: "${br.name}"\n\n${br.resume_text.substring(0, 1400)}`
      : 'No resume uploaded yet.'
    const aboutMe = profile?.about_me?.trim() || 'Not provided.'
    const prompt = `You are simultaneously a senior hiring manager at ${job.company} who has reviewed thousands of resumes, and a career coach who is deeply invested in helping this specific person land this specific job. Your job is to give them the most honest, useful, specific analysis possible.

Job: ${job.title} at ${job.company}
Description: ${job.description.substring(0, 900)}
Required skills: ${(job as any).skills?.map((s: any) => s.name).join(', ') || 'See description'}

Candidate resume:
${resumeText}

About Me: ${aboutMe}
Career field: ${profile?.career_field || 'not specified'}

Write a professional analysis using exactly these four bold headings, each followed by one focused paragraph. Reference specific details from their actual resume and About Me:

**Resume-to-Role Match**
[Be direct about how well this resume actually matches. Name specific skills or experience that align or are missing.]

**Culture & Values Alignment**
[Assess fit based on what they have shared about themselves and what you know about ${job.company}.]

**Hiring Manager Verdict**
[Speak as the hiring manager. Would this resume get an interview? What would make you hesitate?]

**What to Emphasize**
[Give the candidate 2-3 concrete things to lead with in their application and interviews.]

Do not use asterisks inside paragraphs. Do not ask them to do anything. Be warm but honest.`
    const text = await callAI(prompt, 'match')
    setMatchAI(text)
    setMatchLoading(false)
  }

  async function runTailor() {
    if (tailorDone.current || tailorLoading || !job) return
    tailorDone.current = true
    setTailorLoading(true)
    const br = bestResume(resumes)
    const resumeText = br
      ? `Resume: "${br.name}"\n\n${br.resume_text.substring(0, 1400)}`
      : 'No resume on file — give general suggestions based on the job description alone.'
    const prompt = `You are a resume expert and career coach. A candidate is applying to ${job.title} at ${job.company}. Give exactly 3 targeted resume edits that would most improve their chances of getting an interview.

Job description: ${job.description.substring(0, 700)}
Required skills: ${(job as any).skills?.map((s: any) => s.name).join(', ') || 'See description'}

${resumeText}

Return ONLY a valid JSON array. No markdown, no code fences, no explanation before or after:
[{"priority":"HIGH","section":"exact section name","original":"current text or gap","tailored":"improved version","why":"specific reason this helps","talkAboutIt":"one interview tie-back sentence"},{"priority":"MEDIUM","section":"exact section name","original":"current text or gap","tailored":"improved version","why":"specific reason","talkAboutIt":"interview tie-back"},{"priority":"LOW","section":"exact section name","original":"current text or gap","tailored":"improved version","why":"specific reason","talkAboutIt":"interview tie-back"}]`
    try {
      const raw = await callAI(prompt, 'tailor')
      const clean = raw.replace(/```json|```/g, '').trim()
      const start = clean.indexOf('[')
      const end   = clean.lastIndexOf(']')
      if (start !== -1 && end !== -1) {
        const items = JSON.parse(clean.substring(start, end + 1))
        setTailorAI(Array.isArray(items) ? items : [])
      } else {
        setTailorAI([])
      }
    } catch { setTailorAI([]) }
    setTailorLoading(false)
    fetch('/api/coach', {method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({event:'tailor_run', data:{title: job?.title, company: job?.company}})}).catch(()=>{})
  }

  async function runStandout() {
    if (standoutDone.current || standoutLoading || !job) return
    standoutDone.current = true
    setStandoutLoading(true)
    const br = bestResume(resumes)
    const prompt = `You are a career coach helping a specific person stand out for ${job.title} at ${job.company}. This is not generic advice.

Job: ${job.description.substring(0, 500)}
About them: ${profile?.about_me?.trim() || 'not provided'}
Resume excerpt: ${br ? br.resume_text.substring(0, 600) : 'none uploaded'}

Return ONLY valid JSON. No markdown, no code fences:
{"tips":["specific tip 1 referencing their actual background","specific tip 2","specific tip 3","specific tip 4"],"whyYou":"2-3 sentences on exactly why this specific person is a strong fit for this specific role — reference their actual experience and ${job.company}'s known culture","email":{"subject":"compelling subject line personalized to this role","body":"full outreach email that sounds like a real person wrote it — warm, specific, confident. Include [brackets] for personalization spots."}}`
    try {
      const raw = await callAI(prompt, 'standout')
      const clean = raw.replace(/```json|```/g, '').trim()
      const start = clean.indexOf('{')
      const end   = clean.lastIndexOf('}')
      setStandoutAI(start !== -1 && end !== -1 ? JSON.parse(clean.substring(start, end + 1)) : null)
    } catch { setStandoutAI(null) }
    setStandoutLoading(false)
  }

  async function generateCoverLetter() {
    if (!job || coverLoading) return
    setCoverLoading(true)
    setShowCover(true)
    const br = bestResume(resumes)
    const resumeText = br ? br.resume_text.substring(0, 1200) : 'No resume uploaded.'
    const aboutMe = profile?.about_me?.trim() || 'Not provided.'
    const prompt = `You are a professional cover letter writer who thinks like a hiring manager. Write a compelling, personalized cover letter for this candidate.

Job: ${job.title} at ${job.company}
Job description: ${job.description.substring(0, 800)}
Required skills: ${(job as any).skills?.map((s: any) => s.name).join(', ') || 'See description'}

Candidate resume:
${resumeText}

About Me: ${aboutMe}

Write a 3-paragraph cover letter that:
- Opens with a specific, compelling hook referencing ${job.company} — not a generic opener
- Middle paragraph connects their actual experience to the role's key requirements with specific details
- Closes with confidence and a clear call to action
- Sounds like a real person wrote it — warm, direct, professional
- Uses [Your Name] and [Date] as placeholders
- Does NOT start with "I am writing to express my interest" or use clichés like "I would be a great fit"

Return only the cover letter text. No subject line, no extra commentary.`
    const text = await callAI(prompt)
    setCoverLetter(text)
    setCoverLoading(false)
  }

  async function runInterviewPrep() {
    if (!job) return
    prepAIDone.current = true
    setPrepAILoading(true)
    const br = bestResume(resumes)
    const count = isPro ? 8 : 4
    const prompt = `You are a senior interviewer preparing ${count} targeted questions for a ${job.title} candidate at ${job.company}.

Job title: ${job.title}
Company: ${job.company}
Job description: ${(job.description || '').substring(0, 1500)}
Key skills required: ${topSkills.join(', ')}
${profile?.career_field ? `Candidate career field: ${profile.career_field}` : ''}
${profile?.career_stage ? `Candidate career stage: ${profile.career_stage}` : ''}
${br ? `Candidate resume excerpt:\n${br.resume_text.substring(0, 2000)}` : ''}

Return a JSON array of exactly ${count} questions:
[
  {
    "category": "Role-Specific" | "Behavioral" | "Situational" | "Culture & Motivation",
    "question": "<specific question tailored to this job and candidate>",
    "hint": "<one-sentence tactical tip — what makes a strong answer to this specific question>",
    "highlight": "<what this candidate should highlight from their background — cite something specific from their resume or field. Leave empty string if no resume context.>"
  }
]

Spread across: ${isPro ? '3 Role-Specific, 2 Behavioral, 2 Situational, 1 Culture & Motivation' : '2 Role-Specific, 1 Behavioral, 1 Culture & Motivation'}. Be specific to this job — not generic questions.`

    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, type: 'interview', isPro }) })
      const data = await res.json()
      const raw = (data.text || '').trim()
      const s = raw.indexOf('['); const e = raw.lastIndexOf(']')
      if (s !== -1 && e !== -1) {
        const items = JSON.parse(raw.substring(s, e + 1))
        setPrepAI(Array.isArray(items) ? items : [])
      }
    } catch { /* leave empty, static fallback shows */ }
    setPrepAILoading(false)
    fetch('/api/coach', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'tailor_run', data: { title: job.title, company: job.company } }) }).catch(() => {})
  }

  async function runNegotiate() {
    if (!job) return
    setNegotiateLoading(true)
    const br = bestResume(resumes)
    const count = isPro ? 3 : 1
    const prompt = `You are a salary negotiation expert coaching a candidate for ${job.title} at ${job.company}.

Job details:
- Title: ${job.title}
- Company: ${job.company}
- Posted salary range: ${job.pay || 'Not listed'}
- Location: ${job.location || 'Not specified'}
${profile?.career_field ? `- Career field: ${profile.career_field}` : ''}
${profile?.career_stage ? `- Career stage: ${profile.career_stage}` : ''}
${profile?.pay_target   ? `- Candidate's target salary: ${profile.pay_target}` : ''}
${br ? `\nCandidate resume excerpt:\n${br.resume_text.substring(0, 1200)}` : ''}

Generate a personalized negotiation guide. Use the actual company name, role, and salary range. Be specific — not generic advice. Sound like a trusted mentor.

Return ONLY valid JSON:
{
  "targetRange": { "low": <integer, no commas>, "high": <integer, no commas>, "note": "<1-sentence rationale for this range>" },
  "opening": "<exact 2-3 sentence script to say when they extend the offer — warm but firm>",
  "talkingPoints": [${Array(count).fill('{ "point": "<strength label>", "script": "<exact words to say>" }').join(', ')}],
  "pushbacks": [${Array(count).fill('{ "scenario": "<what they say>", "response": "<what you say>" }').join(', ')}]${isPro ? `,
  "counterOffer": { "script": "<exact counter-offer language — specific dollar amount based on targetRange.high>", "floorNote": "<what to say if they still can't move — alternatives to base>" },
  "emailTemplate": "<subject line on first line, then blank line, then full ~120-word follow-up email body confirming verbal negotiation, professional tone>"` : ''}
}`

    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, type: 'negotiate', isPro }) })
      const data = await res.json()
      const raw = (data.text || '').trim()
      const s = raw.indexOf('{'); const e = raw.lastIndexOf('}')
      if (s !== -1 && e !== -1) setNegotiateResult(JSON.parse(raw.substring(s, e + 1)))
    } catch { /* keep null — static fallback remains */ }
    setNegotiateLoading(false)
  }

  function copyNeg(key: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setNegotiatesCopied(p => ({ ...p, [key]: true }))
    setTimeout(() => setNegotiatesCopied(p => ({ ...p, [key]: false })), 2000)
  }

  async function getPrepFeedback(idx: number, question: string) {
    const answer = prepAnswers[idx] || ''
    if (!answer.trim()) { setPrepFeedback(p => ({ ...p, [idx]: 'Write your answer first.' })); return }
    setPrepLoading(p => ({ ...p, [idx]: true }))
    const prompt = `You are a career coach and former hiring manager. Give honest, specific feedback on this interview answer in 2-3 sentences. What is strong, what would make a hiring manager hesitate, and what one thing would make it stronger.

Question: "${question}"
Their answer: "${answer}"`
    const text = await callAI(prompt)
    setPrepFeedback(p => ({ ...p, [idx]: text }))
    setPrepLoading(p => ({ ...p, [idx]: false }))
  }

  function handleTab(t: typeof tab) {
    setTab(t)
    if (t === 'tailor'   && !tailorDone.current   && !tailorLoading   && profile?.ai_prefs?.autoTailor   !== false) runTailor()
    if (t === 'standout' && !standoutDone.current && !standoutLoading && profile?.ai_prefs?.autoStandout !== false) runStandout()
    if (t === 'prep'     && !prepAIDone.current   && !prepAILoading   && profile?.ai_prefs?.autoInterviewPrep === true) runInterviewPrep()
  }

  async function signOut() {
    await fetch('/api/signout', { method: 'POST' })
    window.location.href = '/'
  }

  function downloadCoverLetter() {
    const blob = new Blob([coverLetter], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `cover-letter-${job?.company.toLowerCase().replace(/\s+/g, '-') || 'fitted'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function toggleSave() {
    if (!job) return
    const existing = trackerEntries.find(e => e.job_id === jobId && !e.deleted_at)
    if (existing) {
      const now = new Date().toISOString()
      await fetch('/api/tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id, deleted_at: now }) })
      setTrackerEntries(prev => prev.map(e => e.id === existing.id ? { ...e, deleted_at: now } : e))
    } else {
      await fetch('/api/tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_id: job.id, job_title: job.title, job_company: job.company, job_logo: job.logo, job_logo_bg: job.logoBg, job_logo_color: job.logoColor, job_pay: job.pay, job_url: job.url || '', column_id: 'saved', resume_name: bestResume(resumes)?.name || null }) })
      const t = await fetch('/api/tracker').then(r => r.json())
      if (t?.entries) setTrackerEntries(t.entries)
    }
  }

  async function applyToJob() {
    if (!job?.url) return
    window.open(job.url, '_blank', 'noopener,noreferrer')
    const existing = trackerEntries.find(e => e.job_id === jobId && !e.deleted_at)
    if (existing && existing.column_id === 'saved') {
      await fetch('/api/tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id, column_id: 'applied' }) })
      setTrackerEntries(prev => prev.map(e => e.id === existing.id ? { ...e, column_id: 'applied' } : e))
    }
    setApplyDone(true)
    setTimeout(() => setApplyDone(false), 2500)
  }

  async function ensureTrackerEntry(): Promise<string | null> {
    const existing = trackerEntries.find(e => e.job_id === jobId && !e.deleted_at)
    if (existing) return existing.id
    if (!job) return null
    await fetch('/api/tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_id: job.id, job_title: job.title, job_company: job.company, job_logo: job.logo, job_logo_bg: job.logoBg, job_logo_color: job.logoColor, job_pay: job.pay, job_url: job.url || '', column_id: 'saved', resume_name: bestResume(resumes)?.name || null }) })
    const t = await fetch('/api/tracker').then(r => r.json())
    if (t?.entries) {
      setTrackerEntries(t.entries)
      const fresh = (t.entries as TrackerEntry[]).find((e: TrackerEntry) => e.job_id === jobId && !e.deleted_at)
      return fresh?.id ?? null
    }
    return null
  }

  function onNotesChange(val: string) {
    setNotes(val)
    if (notesRef.current) clearTimeout(notesRef.current)
    notesRef.current = setTimeout(async () => {
      setNotesSaveInd('Saving…')
      const id = await ensureTrackerEntry()
      if (id) {
        await fetch('/api/tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, notes: val }) })
        setNotesSaveInd('Saved ✓')
        setTimeout(() => setNotesSaveInd(''), 2000)
      } else {
        setNotesSaveInd('')
      }
    }, 800)
  }

  async function startCheckout(plan: 'monthly' | 'annual' | 'extraSlot' = 'monthly') {
    if (!user) return
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: plan === 'extraSlot' ? 'resume_slot' : plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Could not start checkout. Please try again.')
      }
    } catch (err) {
      alert('Checkout failed. Please try again.')
    }
  }

  if (!dataReady || !job) return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#b8a99a' }}>
      {job === null && dataReady
        ? <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16, color: '#7a7a85' }}>Job not found.</p>
            <button onClick={() => router.push('/')} style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontFamily: 'sans-serif' }}>Back to dashboard</button>
          </div>
        : 'Loading…'
      }
    </div>
  )

  const similar = allJobs
    .filter(j => j.id !== jobId && j.match > 0)
    .sort((a, b) => b.match - a.match)
    .slice(0, 3)
  const br       = bestResume(resumes)
  const isPro    = profile?.plan === 'pro'
  const isCancelled = isPro && (profile?.subscription_status === 'cancelled' || profile?.subscription_status === 'canceling')
  const score    = job.match
  const isSaved      = trackerEntries.some(e => e.job_id === jobId && !e.deleted_at)
  const trackerEntry = trackerEntries.find(e => e.job_id === jobId && !e.deleted_at)
  const COL_META: Record<string, [string, string, string]> = {
    saved:     ['Saved',         '#fdf3e3', '#b8750a'],
    applied:   ['Applied',       '#eaeffe', '#185fa5'],
    phone:     ['Phone Screen',  '#f0e8fe', '#6d28d9'],
    interview: ['Interview',     '#e6f5ed', '#1a7a4a'],
    offer:     ['Offer',         '#e6f5ed', '#0d5c34'],
    rejected:  ['Rejected',      '#fdecea', '#a32d2d'],
  }

  const TABS = [
    { id: 'match',    label: 'Match Details' },
    { id: 'tailor',   label: 'Tailor My Resume' },
    { id: 'standout', label: 'Help Me Stand Out' },
    { id: 'emails',   label: 'Email Drafts' },
    { id: 'prep',     label: 'Interview Prep' },
    { id: 'career',   label: 'Career Path ✦', pro: true },
    { id: 'notes',    label: 'Notes' },
    { id: 'rejected', label: 'Why Rejected ✦', pro: true },
  ]

  const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
    apply: {
      subject: `Re: ${job.title} — [Your Name]`,
      body: `Hi [Hiring Manager's Name],\n\nI just submitted my application for the ${job.title} role and wanted to reach out directly.\n\n[1–2 sentences: what specifically draws you to ${job.company}, and what makes you the right fit.]\n\nI'd love to connect if you have a few minutes.\n\nBest,\n[Your Name]`,
    },
    followup: {
      subject: `Following up — ${job.title} Application`,
      body: `Hi [Name],\n\nI wanted to follow up on my application for the ${job.title} position, submitted [X days] ago. I remain very interested in the role at ${job.company}.\n\nIf there's anything additional I can provide, I'm happy to send it along.\n\nBest,\n[Your Name]`,
    },
    thankyou: {
      subject: `Thank you — ${job.title} Interview`,
      body: `Hi [Name],\n\nThank you for taking the time to speak with me about the ${job.title} role. I really enjoyed learning more about [something specific they mentioned] and left more excited about the opportunity.\n\nI'm confident I could make a real contribution.\n\nWarm regards,\n[Your Name]`,
    },
    checkin: {
      subject: `Checking in — ${job.title}`,
      body: `Hi [Name],\n\nI hope you're doing well. I wanted to check in on the ${job.title} search — I've continued to be excited about joining ${job.company}.\n\nBest,\n[Your Name]`,
    },
  }

  const topSkills = ((job as any).skills as { name: string }[] | undefined)?.slice(0, 2).map(s => s.name) ?? job.tags.slice(0, 2)
  const prepQuestions = [
    { q: `Tell me about a specific project or experience that prepared you for the ${job.title} role.` },
    { q: topSkills.length >= 2
        ? `Walk me through how you've used ${topSkills[0]} and ${topSkills[1]} in a real work situation.`
        : `What does your strongest relevant experience look like for this type of role?` },
    { q: `Why ${job.company} specifically — what about this organization stands out to you?` },
    { q: `How do you prioritize competing deadlines or stakeholder requests under pressure?` },
    { q: `Where do you see yourself in three years, and how does this role fit that path?` },
  ]

  const priorityColor: Record<string, [string, string]> = {
    HIGH:   ['#fdecea', '#a32d2d'],
    MEDIUM: ['#fdf3e3', '#854f0b'],
    LOW:    ['#e6f5ed', '#3b6d11'],
  }

  const Spinner = ({ label = 'Analyzing…' }: { label?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0', color: '#7a7a85', fontSize: 13 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #eaeffe', borderTop: '3px solid #2d5be3', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', fontFamily: 'sans-serif' }}
      onClick={() => setShowMenu(false)}>

      <nav style={{ height: 60, background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>
        <button onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: '#7a7a85', cursor: 'pointer', fontSize: 13, fontFamily: 'sans-serif' }}>
          ← Back
        </button>
        <div style={{ width: 1, height: 32, background: 'rgba(0,0,0,.1)' }} />
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1a1a1f', letterSpacing: '-.02em' }}>fitted<span style={{ color: '#2d5be3' }}>.</span></div>
          <div style={{ fontSize: 11, color: '#b8a99a', fontWeight: 300, marginTop: 2 }}>get a career tailor-made for you</div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={toggleSave}
          style={{ background: isSaved ? '#fdf3e3' : 'none', color: isSaved ? '#b8750a' : '#7a7a85', border: `1px solid ${isSaved ? 'rgba(184,117,10,.3)' : 'rgba(0,0,0,.12)'}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {isSaved ? '★ Saved' : '☆ Save'}
        </button>
        {job.url && (
          <button onClick={applyToJob}
            style={{ background: applyDone ? '#1a7a4a' : '#2d5be3', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'sans-serif', transition: 'background .2s' }}>
            {applyDone ? 'Applied ✓' : 'Apply Now →'}
          </button>
        )}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowMenu(m => !m)}
            style={{ background: 'none', border: '1px solid rgba(0,0,0,.12)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif' }}>
            {user?.email || 'Account'} ▾
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,.12)', minWidth: 200, zIndex: 200, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', fontSize: 12, color: '#b0b0b8', borderBottom: '1px solid rgba(0,0,0,.07)' }}>{user?.email}</div>
              {isPro
                ? <button style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: 13, color: '#3d3d45', cursor: 'pointer', fontFamily: 'sans-serif' }}>Manage subscription</button>
                : <button onClick={() => { setShowMenu(false); startCheckout('monthly') }} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: 13, color: '#b8750a', cursor: 'pointer', fontFamily: 'sans-serif' }}>✦ Upgrade to Pro</button>
              }
              <button onClick={signOut} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid rgba(0,0,0,.07)', fontSize: 13, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif' }}>Sign out</button>
            </div>
          )}
        </div>
      </nav>

      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
        <div style={{ padding: '16px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: job.logoBg, color: job.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontSize: 18, border: '1px solid rgba(0,0,0,.07)', flexShrink: 0 }}>{job.logo}</div>
            <div>
              <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 22, color: '#1a1a1f', margin: '0 0 3px', fontWeight: 400 }}>{job.title}</h1>
              <p style={{ fontSize: 13, color: '#7a7a85', margin: 0 }}><strong style={{ color: '#3d3d45', fontWeight: 500 }}>{job.company}</strong> · {job.location} · {job.pay}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ background: job.type === 'Remote' ? '#e6f5ed' : '#fdf3e3', color: job.type === 'Remote' ? '#1a7a4a' : '#b8750a', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{job.type}</span>
            <span style={{ background: '#eaeffe', color: '#185fa5', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{score}% Resume Match</span>
            {br && <span style={{ background: '#e6f5ed', color: '#1a7a4a', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>Using: {br.name}</span>}
            {isPro && (isCancelled ? <span style={{ background: 'rgba(26, 122, 74, 0.45)', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>✦ Pro · ends soon</span> : <span style={{ background: '#1a7a4a', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✦ Pro</span>)}
            {trackerEntry && COL_META[trackerEntry.column_id] && (
              <span style={{ background: COL_META[trackerEntry.column_id][1], color: COL_META[trackerEntry.column_id][2], padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                {COL_META[trackerEntry.column_id][0]}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(0,0,0,.07)' }}>
            <span style={{ fontSize: 12, color: '#b0b0b8' }}>Posted {job.posted}</span>
            {job.url
              ? <button onClick={applyToJob}
                  style={{ background: applyDone ? '#1a7a4a' : '#2f3e5c', color: '#fff', padding: '9px 20px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background .2s' }}>
                  {applyDone ? 'Applied ✓' : 'Apply Now →'}
                </button>
              : <span style={{ fontSize: 12, color: '#b0b0b8', fontStyle: 'italic' }}>Application link unavailable</span>
            }
          </div>
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 8px', borderTop: '1px solid rgba(0,0,0,.07)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTab(t.id as any)}
              style={{ padding: '10px 14px', fontSize: 12.5, background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #2d5be3' : '2px solid transparent', color: tab === t.id ? '#2d5be3' : t.pro ? '#b8750a' : '#7a7a85', fontWeight: tab === t.id ? 500 : 400, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'sans-serif', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 60px - 148px)', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>

          {tab === 'match' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
                {[
                  { label: 'Resume Match', value: score,                                               note: 'Based on your best resume' },
                  { label: 'Personal Fit', value: (job as any).personalFit || Math.max(50, score - 5), note: 'Based on About Me & profile' },
                  { label: 'Likeliness',   value: (job as any).likeliness  || Math.max(45, score - 8), note: 'Likelihood of progressing' },
                ].map(s => {
                  const r = 24; const circ = 2 * Math.PI * r
                  const dash = (s.value / 100) * circ
                  return (
                    <div key={s.label} style={{ background: '#f4f2ed', borderRadius: 10, padding: '12px 10px 10px', textAlign: 'center' }}>
                      <div style={{ position: 'relative', width: 60, height: 60, margin: '0 auto 8px' }}>
                        <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="5" />
                          <circle cx="30" cy="30" r={r} fill="none" stroke={mc(s.value)} strokeWidth="5"
                            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: mc(s.value), letterSpacing: -.5 }}>{s.value}%</div>
                      </div>
                      <div style={{ fontSize: 10, color: '#7a7a85', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: '#b0b0b8', marginTop: 2 }}>{s.note}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #2d5be3', borderRadius: '0 10px 10px 0', padding: '18px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 4 }}>✦ fitted. coach analysis</div>
                <div style={{ fontSize: 10, color: '#b0b0b8', marginBottom: 14 }}>{isPro ? "Powered by fitted.'s advanced AI" : "Powered by fitted.'s fast AI"}</div>
                {matchLoading
                  ? <Spinner label="Reading your resume and About Me…" />
                  : matchAI
                    ? renderAI(matchAI)
                    : <p style={{ fontSize: 13, color: '#b0b0b8', fontStyle: 'italic', margin: 0 }}>Analysis loading…</p>
                }
              </div>
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Match breakdown</div>
                {[
                  { label: 'Skills match',    pct: Math.min(99, score + 3), color: '#2d5be3' },
                  { label: 'Experience',      pct: Math.max(55, score - 8), color: '#1a7a4a' },
                  { label: 'Keywords found',  pct: Math.min(99, score + 1), color: '#b8750a' },
                  { label: 'Culture signals', pct: Math.max(60, score - 4), color: '#6d28d9' },
                ].map(bar => (
                  <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <div style={{ fontSize: 12, color: '#3d3d45', width: 120, flexShrink: 0 }}>{bar.label}</div>
                    <div style={{ flex: 1, height: 5, background: '#e8e4db', borderRadius: 20, overflow: 'hidden' }}>
                      <div style={{ width: `${bar.pct}%`, height: '100%', background: bar.color, borderRadius: 20 }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#7a7a85', width: 34, textAlign: 'right' as const }}>{bar.pct}%</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Keywords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {job.tags.map((t: string) => (
                    <span key={t} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: '#eaeffe', color: '#2d5be3' }}>{t}</span>
                  ))}
                </div>
              </div>
              <details style={{ border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, overflow: 'hidden' }}>
                <summary style={{ padding: '12px 16px', background: '#f4f2ed', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#3d3d45', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                  Job description <span style={{ fontSize: 11, color: '#7a7a85' }}>▾ expand</span>
                </summary>
                <div style={{ padding: '14px 16px', fontSize: 13, color: '#3d3d45', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.description}</div>
              </details>
            </div>
          )}

          {tab === 'tailor' && (
            <div>
              {tailorLoading
                ? <Spinner label="Analyzing your resume against this role…" />
                : tailorAI.length > 0
                  ? <>
                      <div style={{ background: '#eaeffe', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#185fa5' }}>
                        <strong>{tailorAI.length} suggested edits</strong> — applying all could raise your match from {score}% → {Math.min(99, score + tailorAI.length * 5)}%. Your voice stays intact.
                      </div>
                      {tailorAI.map((item: any, i: number) => {
                        const [bg, col] = priorityColor[item.priority] || priorityColor.MEDIUM
                        return (
                          <div key={i} style={{ border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ background: bg, color: col, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{item.priority}</span>
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1a1a1f' }}>{item.section}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                              <div style={{ background: '#fdecea', borderRadius: 6, padding: '8px 10px' }}>
                                <div style={{ fontSize: 9, fontWeight: 600, color: '#a32d2d', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>Original</div>
                                <div style={{ fontSize: 12, color: '#791f1f', lineHeight: 1.5 }}>{item.original}</div>
                              </div>
                              <div style={{ background: '#e6f5ed', borderRadius: 6, padding: '8px 10px' }}>
                                <div style={{ fontSize: 9, fontWeight: 600, color: '#27500a', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>Tailored</div>
                                <div style={{ fontSize: 12, color: '#27500a', lineHeight: 1.5 }}>{item.tailored}</div>
                              </div>
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12, color: '#2d5be3', lineHeight: 1.5 }}><strong>Why →</strong> {item.why}</div>
                            {item.talkAboutIt && <div style={{ marginTop: 4, fontSize: 11.5, color: '#7a7a85', lineHeight: 1.5 }}><strong style={{ color: '#3d3d45' }}>Talk about it:</strong> {item.talkAboutIt}</div>}
                          </div>
                        )
                      })}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button style={{ flex: 1, background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>↓ Download tailored resume</button>
                        <button onClick={generateCoverLetter} style={{ flex: 1, background: '#f4f2ed', color: '#3d3d45', border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, padding: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>✦ Generate cover letter</button>
                      </div>
                      <div style={{ marginTop: 12, background: '#faf8ff', border: '1px solid rgba(109,40,217,.15)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#6d28d9' }}>Want a full before/after optimization with keyword analysis?</span>
                        <button onClick={() => router.push(`/optimize`)}
                          style={{ background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', whiteSpace: 'nowrap' as const }}>
                          Full optimization →
                        </button>
                      </div>
                    </>
                  : tailorDone.current
                    ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#7a7a85' }}>
                        <p style={{ marginBottom: 12 }}>Could not generate suggestions. Try refreshing.</p>
                        <button onClick={() => { tailorDone.current = false; runTailor() }} style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: 'sans-serif' }}>Retry</button>
                      </div>
                    : null
              }
            </div>
          )}

          {tab === 'standout' && (
            <div>
              {standoutLoading
                ? <Spinner label="Building your stand-out strategy…" />
                : standoutAI
                  ? <>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1f', marginBottom: 12 }}>Before you apply</div>
                        {(standoutAI.tips || []).map((tip: string, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eaeffe', color: '#2d5be3', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                            <p style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.6, margin: 0 }}>{tip}</p>
                          </div>
                        ))}
                      </div>
                      {standoutAI.whyYou && (
                        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #2d5be3', borderRadius: '0 8px 8px 0', padding: '14px 16px', marginBottom: 16 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Why you paragraph</div>
                          <p style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.7, margin: '0 0 10px', fontStyle: 'italic' }}>{standoutAI.whyYou}</p>
                          <button onClick={() => navigator.clipboard?.writeText(standoutAI.whyYou)}
                            style={{ background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif' }}>Copy</button>
                        </div>
                      )}
                      {standoutAI.email && (
                        <div style={{ border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1f', marginBottom: 10 }}>✦ Stand-out outreach draft</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 5 }}>Subject</div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1f', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,.07)' }}>{standoutAI.email.subject}</div>
                          <div style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{standoutAI.email.body}</div>
                          <button onClick={() => navigator.clipboard?.writeText(`Subject: ${standoutAI.email.subject}\n\n${standoutAI.email.body}`)}
                            style={{ marginTop: 10, background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif' }}>Copy email</button>
                        </div>
                      )}
                    </>
                  : standoutDone.current
                    ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#7a7a85' }}>
                        <p style={{ marginBottom: 12 }}>Could not generate. Try again.</p>
                        <button onClick={() => { standoutDone.current = false; runStandout() }} style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: 'sans-serif' }}>Retry</button>
                      </div>
                    : null
              }
            </div>
          )}

          {tab === 'emails' && (
            <div>
              <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
                {([['apply','After applying'],['followup','Follow-up'],['thankyou','Thank-you note'],['checkin','Checking in']] as [string,string][]).map(([id, lbl]) => (
                  <button key={id} onClick={() => setEmailType(id as any)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: emailType === id ? '1px solid #2d5be3' : '1px solid rgba(0,0,0,.1)', background: emailType === id ? '#eaeffe' : '#fff', color: emailType === id ? '#2d5be3' : '#7a7a85', fontSize: 12.5, cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: emailType === id ? 500 : 400 }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 6 }}>Subject</div>
                <div contentEditable suppressContentEditableWarning style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1f', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(0,0,0,.07)', outline: 'none' }}>
                  {EMAIL_TEMPLATES[emailType]?.subject}
                </div>
                <div contentEditable suppressContentEditableWarning style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.8, whiteSpace: 'pre-wrap', outline: 'none', minHeight: 80 }}>
                  {EMAIL_TEMPLATES[emailType]?.body}
                </div>
              </div>
              <button onClick={() => navigator.clipboard?.writeText(`Subject: ${EMAIL_TEMPLATES[emailType]?.subject}\n\n${EMAIL_TEMPLATES[emailType]?.body}`)}
                style={{ background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#3d3d45', cursor: 'pointer', fontFamily: 'sans-serif', marginBottom: 14 }}>Copy email</button>
              {!isPro
                ? <div style={{ background: '#fdf3e3', border: '1px solid rgba(184,117,10,.2)', borderRadius: 8, padding: '12px 14px', fontSize: 12.5, color: '#854f0b', lineHeight: 1.6 }}>✦ Pro members get a personalized AI-generated email for each template — written specifically for this role and company.</div>
                : <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Pro coaching tips</div>
                    {emailType === 'apply'    && <><div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #b8750a', borderRadius: '0 8px 8px 0', padding: '10px 14px', marginBottom: 8, fontSize: 12.5, color: '#3d3d45', lineHeight: 1.5 }}>Look up the hiring manager on LinkedIn — a named email gets opened far more often than "Hi there."</div><div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #b8750a', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 12.5, color: '#3d3d45', lineHeight: 1.5 }}>Reference something real about {job.company} — a campaign, a product, a brand moment. One specific detail beats three generic ones.</div></>}
                    {emailType === 'followup' && <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #b8750a', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 12.5, color: '#3d3d45', lineHeight: 1.5 }}>Wait 5–7 business days before sending. If no reply after 10+ days, one more short follow-up is fine.</div>}
                    {emailType === 'thankyou' && <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #b8750a', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 12.5, color: '#3d3d45', lineHeight: 1.5 }}>Send within 24 hours. Reference something specific they said — a team challenge, a project. Generic thank-yous get skipped.</div>}
                    {emailType === 'checkin'  && <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #b8750a', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 12.5, color: '#3d3d45', lineHeight: 1.5 }}>Use this 2–3 weeks after your follow-up if you still haven't heard. After this, let it go and move on.</div>}
                  </div>
              }
            </div>
          )}

          {tab === 'prep' && (
            <div>
              {/* AI Interview Prep */}
              {prepAI.length === 0 && !prepAILoading && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: '#7a7a85', marginBottom: 14, lineHeight: 1.6 }}>
                    Generate {isPro ? '8' : '4'} targeted questions for this role — with suggested talking points based on your background.
                  </p>
                  <button onClick={runInterviewPrep}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#7c5cbf', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                    ✦ Generate Interview Prep
                  </button>
                  {!isPro && <p style={{ fontSize: 11.5, color: '#b0b0b8', marginTop: 8 }}>Pro unlocks 8 questions + personalized talking points</p>}
                </div>
              )}
              {prepAILoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0', color: '#7a7a85', fontSize: 13 }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #e0d8f0', borderTopColor: '#7c5cbf', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Preparing your questions…
                </div>
              )}
              {prepAI.length > 0 && (
                <>
                  {prepAI.map((q, i) => {
                    const catColor: Record<string, [string,string]> = {
                      'Role-Specific':       ['#eaeffe', '#185fa5'],
                      'Behavioral':          ['#e6f5ed', '#1a7a4a'],
                      'Situational':         ['#fdf3e3', '#854f0b'],
                      'Culture & Motivation':['#f4f0fb', '#6b3fa0'],
                    }
                    const [catBg, catFg] = catColor[q.category] ?? ['#f4f2ed', '#3d3d45']
                    return (
                      <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: 16, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ background: catBg, color: catFg, fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: 20 }}>{q.category}</span>
                          <span style={{ fontSize: 11, color: '#b0b0b8' }}>Q{i + 1} of {prepAI.length}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1f', marginBottom: 10, lineHeight: 1.4 }}>{q.question}</div>
                        {q.hint && <div style={{ fontSize: 12, color: '#7a7a85', marginBottom: isPro && q.highlight ? 10 : 12, lineHeight: 1.5, fontStyle: 'italic' }}>💡 {q.hint}</div>}
                        {isPro && q.highlight && (
                          <div style={{ background: '#f4f0fb', borderLeft: '3px solid #7c5cbf', borderRadius: '0 8px 8px 0', padding: '8px 12px', marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#7c5cbf', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 3 }}>fitted. thinks</div>
                            <div style={{ fontSize: 12.5, color: '#3d1a6a', lineHeight: 1.55 }}>{q.highlight}</div>
                          </div>
                        )}
                        {!isPro && i === 3 && (
                          <div style={{ background: '#fdf3e3', border: '1px solid rgba(184,117,10,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 12.5, color: '#854f0b', lineHeight: 1.5 }}>
                            ✦ Pro unlocks 4 more questions + personalized talking points for each.
                          </div>
                        )}
                        <textarea value={prepAnswers[i] || ''} onChange={e => setPrepAnswers(p => ({ ...p, [i]: e.target.value }))}
                          placeholder="Your answer — what specific story will you use?"
                          style={{ width: '100%', minHeight: 80, padding: 10, border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, color: '#1a1a1f', background: '#f4f2ed', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' as const }} />
                        {isPro
                          ? <div style={{ marginTop: 6 }}>
                              <button onClick={() => getPrepFeedback(i, q.question)} disabled={prepLoading[i]}
                                style={{ background: 'none', border: '1px solid #2d5be3', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#2d5be3', cursor: 'pointer', fontFamily: 'sans-serif', opacity: prepLoading[i] ? .6 : 1 }}>
                                {prepLoading[i] ? 'Reviewing…' : 'Get feedback on my answer →'}
                              </button>
                              {prepFeedback[i] && <div style={{ marginTop: 8, background: '#f4f2ed', borderRadius: 6, padding: '8px 10px', fontSize: 12.5, color: '#3d3d45', lineHeight: 1.6 }}>{prepFeedback[i]}</div>}
                            </div>
                          : <div style={{ marginTop: 6 }}><span style={{ background: '#fdf3e3', color: '#b8750a', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>✦ Pro — get feedback on your answer</span></div>
                        }
                      </div>
                    )
                  })}
                  <button onClick={() => { prepAIDone.current = false; setPrepAI([]); runInterviewPrep() }}
                    style={{ background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 7, padding: '6px 14px', fontSize: 12, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif', marginBottom: 24 }}>
                    ↺ Regenerate questions
                  </button>
                </>
              )}
              {/* Static practice questions — shown only before AI runs */}
              {prepAI.length === 0 && !prepAILoading && prepQuestions.map((q, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: 16, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#b0b0b8', marginBottom: 6 }}>Practice Question {i + 1}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1f', marginBottom: 10, lineHeight: 1.4 }}>{q.q}</div>
                  <textarea value={prepAnswers[i] || ''} onChange={e => setPrepAnswers(p => ({ ...p, [i]: e.target.value }))}
                    placeholder="Write your answer — what specific story will you use?"
                    style={{ width: '100%', minHeight: 80, padding: 10, border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, color: '#1a1a1f', background: '#f4f2ed', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' as const }} />
                  {isPro
                    ? <div style={{ marginTop: 6 }}>
                        <button onClick={() => getPrepFeedback(i, q.q)} disabled={prepLoading[i]}
                          style={{ background: 'none', border: '1px solid #2d5be3', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#2d5be3', cursor: 'pointer', fontFamily: 'sans-serif', opacity: prepLoading[i] ? .6 : 1 }}>
                          {prepLoading[i] ? 'Reviewing…' : 'Get feedback on my answer →'}
                        </button>
                        {prepFeedback[i] && <div style={{ marginTop: 8, background: '#f4f2ed', borderRadius: 6, padding: '8px 10px', fontSize: 12.5, color: '#3d3d45', lineHeight: 1.6 }}>{prepFeedback[i]}</div>}
                      </div>
                    : <div style={{ marginTop: 6 }}><span style={{ background: '#fdf3e3', color: '#b8750a', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>✦ Pro — get feedback on your answer</span></div>
                  }
                </div>
              ))}
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: '2px solid rgba(0,0,0,.07)' }}>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 20, color: '#1a1a1f', margin: '0 0 4px', fontWeight: 400 }}>Salary negotiation ✦</h3>
                <p style={{ fontSize: 13, color: '#7a7a85', marginBottom: 18, lineHeight: 1.6 }}>
                  {isPro ? `Personalized scripts for negotiating at ${job.company}.` : 'Opening script + target range — upgrade for full playbook.'}
                </p>
                {!negotiateResult && !negotiateLoading && (
                  <button onClick={runNegotiate}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a3d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'sans-serif', marginBottom: 6 }}>
                    ✦ Prepare My Negotiation
                  </button>
                )}
                {negotiateLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: '#7a7a85', fontSize: 13 }}>
                    <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #c8e6d4', borderTopColor: '#1a7a4a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Building your negotiation playbook…
                  </div>
                )}
                {negotiateResult && (() => {
                  const nr = negotiateResult
                  const fmt = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`
                  return (
                    <>
                      {/* Target range */}
                      <div style={{ background: '#e6f5ed', border: '1px solid rgba(26,122,74,.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#1a7a4a', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 2 }}>Your target range</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a3d2a', fontFamily: 'Georgia,serif' }}>{fmt(nr.targetRange.low)} – {fmt(nr.targetRange.high)}</div>
                        </div>
                        {nr.targetRange.note && <p style={{ fontSize: 12, color: '#2d6644', lineHeight: 1.5, margin: 0, flex: 1 }}>{nr.targetRange.note}</p>}
                      </div>

                      {/* Opening script */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Opening script</div>
                        <div style={{ background: '#eaeffe', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#1a1a5a', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 6 }}>"{nr.opening}"</div>
                        <button onClick={() => copyNeg('opening', nr.opening)} style={{ background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 6, padding: '4px 12px', fontSize: 11.5, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                          {negotiateCopied['opening'] ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>

                      {/* Talking points */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Key talking points</div>
                        {nr.talkingPoints.map((tp, i) => (
                          <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#1a7a4a', marginBottom: 4 }}>{tp.point}</div>
                            <div style={{ fontSize: 13, color: '#1a1a5a', fontStyle: 'italic', lineHeight: 1.6 }}>"{tp.script}"</div>
                          </div>
                        ))}
                      </div>

                      {/* Pushback responses */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 8 }}>When they push back</div>
                        {nr.pushbacks.map((pb, i) => (
                          <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                            <div style={{ fontSize: 11.5, color: '#7a7a85', marginBottom: 6 }}>They say: <em>"{pb.scenario}"</em></div>
                            <div style={{ fontSize: 13, color: '#1a1a5a', fontStyle: 'italic', lineHeight: 1.6 }}>You: "{pb.response}"</div>
                          </div>
                        ))}
                      </div>

                      {/* Counter-offer + email — Pro only */}
                      {isPro && nr.counterOffer && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Counter-offer script</div>
                          <div style={{ background: '#f4f0fb', border: '1px solid rgba(124,92,191,.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 6 }}>
                            <div style={{ fontSize: 13, color: '#3d1a6a', fontStyle: 'italic', lineHeight: 1.65, marginBottom: 8 }}>"{nr.counterOffer.script}"</div>
                            {nr.counterOffer.floorNote && <div style={{ fontSize: 12, color: '#7a7a85', lineHeight: 1.5, borderTop: '1px solid rgba(0,0,0,.07)', paddingTop: 8 }}>If they can't move: {nr.counterOffer.floorNote}</div>}
                          </div>
                          <button onClick={() => copyNeg('counter', nr.counterOffer!.script)} style={{ background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 6, padding: '4px 12px', fontSize: 11.5, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                            {negotiateCopied['counter'] ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                      {isPro && nr.emailTemplate && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Follow-up email</div>
                          <pre style={{ background: '#f4f2ed', borderRadius: 8, padding: '12px 14px', fontSize: 12.5, color: '#3d3d45', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', margin: '0 0 6px' }}>{nr.emailTemplate}</pre>
                          <button onClick={() => copyNeg('email', nr.emailTemplate!)} style={{ background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 6, padding: '4px 12px', fontSize: 11.5, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                            {negotiateCopied['email'] ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                      {!isPro && (
                        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ filter: 'blur(3px)', opacity: .4, pointerEvents: 'none', padding: 14, background: '#f4f2ed', borderRadius: 10 }}>
                            <div style={{ fontSize: 11, color: '#b0b0b8', textTransform: 'uppercase' as const, marginBottom: 6 }}>Counter-offer script</div>
                            <div style={{ fontSize: 13, fontStyle: 'italic', color: '#3d3d45' }}>"Based on my experience, I was hoping we could land closer to…"</div>
                          </div>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(248,246,241,.9)' }}>
                            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, color: '#1a1a1f' }}>Counter-offer scripts + email templates</div>
                            <div style={{ fontSize: 12, color: '#7a7a85', textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>Pro unlocks 3 talking points, 3 pushback responses, counter-offer language, and a follow-up email.</div>
                            <button onClick={() => startCheckout('monthly')} style={{ background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>Unlock with Pro</button>
                          </div>
                        </div>
                      )}
                      <button onClick={() => { setNegotiateResult(null); runNegotiate() }}
                        style={{ background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 7, padding: '6px 14px', fontSize: 12, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif', marginTop: 4 }}>
                        ↺ Regenerate
                      </button>
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          {tab === 'career' && (
            !isPro
              ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, color: '#b8750a' }}>✦</div>
                  <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: '#1a1a1f', fontWeight: 400 }}>Career Path is a Pro feature</h3>
                  <p style={{ fontSize: 13, color: '#7a7a85', maxWidth: 280, lineHeight: 1.6 }}>See how this role fits into a realistic path from where you are now to where you want to be — with salary milestones.</p>
                  <button onClick={() => startCheckout('monthly')} style={{ background: '#b8750a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>Unlock with Pro</button>
                </div>
              : <div>
                  <p style={{ fontSize: 13, color: '#7a7a85', marginBottom: 20, lineHeight: 1.6 }}>How <strong style={{ color: '#3d3d45' }}>{job.title}</strong> fits a realistic career path.</p>
                  {[
                    { stage: 'Where you are', role: 'Current role',                                          pay: 'Varies',       dot: '#2d5be3' },
                    { stage: 'This role',     role: job.title,                                                pay: job.pay,        dot: '#1a7a4a' },
                    { stage: '2 years out',   role: 'Senior Coordinator / Manager',                           pay: '$55–75k/yr',   dot: '#1a7a4a' },
                    { stage: '5 years out',   role: 'Senior Manager / Director',                              pay: '$80–120k/yr',  dot: '#6d28d9' },
                    { stage: 'North Star',    role: `Head of ${profile?.career_field || 'your field'} — dream company`, pay: '$100–150k/yr', dot: '#6d28d9' },
                  ].map((node, i, arr) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 4 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: node.dot, flexShrink: 0, marginTop: 4 }} />
                        {i < arr.length - 1 && <div style={{ width: 2, height: 32, background: 'rgba(0,0,0,.1)', margin: '3px 0' }} />}
                      </div>
                      <div style={{ paddingBottom: 8 }}>
                        <div style={{ fontSize: 11, color: '#b0b0b8', marginBottom: 2 }}>{node.stage}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1f' }}>{node.role}</div>
                        <div style={{ fontSize: 12, color: '#1a7a4a', fontFamily: 'monospace' }}>{node.pay}</div>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {tab === 'notes' && (
            <div>
              <textarea value={notes} onChange={e => onNotesChange(e.target.value)}
                placeholder="Your thoughts — questions to ask, things to research, why this feels right or wrong…"
                style={{ width: '100%', minHeight: 280, padding: 14, border: '1px solid rgba(0,0,0,.1)', borderRadius: 10, fontFamily: 'sans-serif', fontSize: 13.5, color: '#1a1a1f', background: '#fff', resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' as const }} />
              <p style={{ fontSize: 12, color: notesSaveInd ? '#1a7a4a' : '#b0b0b8', marginTop: 6, minHeight: 18 }}>{notesSaveInd || 'Notes are saved to your tracker.'}</p>
            </div>
          )}

          {tab === 'rejected' && (
            !isPro
              ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, color: '#b8750a' }}>✦</div>
                  <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: '#1a1a1f', fontWeight: 400 }}>Why Rejected is a Pro feature</h3>
                  <p style={{ fontSize: 13, color: '#7a7a85', maxWidth: 280, lineHeight: 1.6 }}>Get analysis of what likely happened and a polite email to request real feedback from the hiring team.</p>
                  <button onClick={() => startCheckout('monthly')} style={{ background: '#b8750a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>Unlock with Pro</button>
                </div>
              : <div>
                  <div style={{ background: '#fdecea', border: '1px solid rgba(192,57,43,.15)', borderLeft: '3px solid #c0392b', borderRadius: '0 10px 10px 0', padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#7a0000', lineHeight: 1.6 }}>
                    Analysis of what may have happened — and a polite email to request real feedback.
                  </div>
                  <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Most likely reason</div>
                    <p style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.6, margin: 0 }}>Your resume match was {score}% — solid, but often just below the threshold for competitive roles. The most common gap: not enough role-specific language in your bullets, or missing a key tool or credential they were screening for.</p>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 8 }}>What to fix for next time</div>
                    {['Mirror the exact language from the job description in your first two resume bullets — that\'s where ATS scoring is heaviest.', 'Add any missing tools or skills to your skills section — even "familiar with" counts. Presence matters more than proficiency at the screening stage.'].map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fdecea', color: '#c0392b', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                        <p style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.6, margin: 0 }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1f', marginBottom: 4 }}>Email to request feedback</div>
                    <p style={{ fontSize: 12, color: '#7a7a85', marginBottom: 12, lineHeight: 1.5 }}>Keep it short and gracious — you're asking a favor, not challenging their decision.</p>
                    <div style={{ background: '#f4f2ed', borderRadius: 8, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#3d3d45', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(0,0,0,.07)' }}>Subject: Following up — {job.title} Application</div>
                      <div style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{`Hi [Name],\n\nThank you for letting me know about your decision regarding the ${job.title} role. I genuinely appreciated the opportunity to learn more about ${job.company} throughout the process.\n\nIf you're open to it, I'd love any brief feedback on my application — even a sentence or two would be incredibly helpful as I continue my search.\n\nI have a lot of respect for the team and hope our paths cross again.\n\nBest,\n[Your Name]`}</div>
                    </div>
                    <button onClick={() => navigator.clipboard?.writeText(`Subject: Following up — ${job.title} Application\n\nHi [Name],\n\nThank you for letting me know about your decision regarding the ${job.title} role. I genuinely appreciated the opportunity to learn more about ${job.company} throughout the process.\n\nIf you're open to it, I'd love any brief feedback on my application — even a sentence or two would be incredibly helpful as I continue my search.\n\nI have a lot of respect for the team and hope our paths cross again.\n\nBest,\n[Your Name]`)}
                      style={{ marginTop: 12, background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 6, padding: '6px 14px', fontSize: 12, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                      Copy email
                    </button>
                  </div>
                  <div style={{ border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1f', marginBottom: 4 }}>Response</div>
                    <p style={{ fontSize: 12, color: '#7a7a85', marginBottom: 10, lineHeight: 1.5 }}>Paste any reply you receive here — fitted. can help you read between the lines.</p>
                    <textarea placeholder="Paste their response here…"
                      style={{ width: '100%', minHeight: 80, padding: 10, border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, color: '#1a1a1f', background: '#f4f2ed', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' as const }} />
                  </div>
                </div>
          )}

        </div>

        <div style={{ width: 240, flexShrink: 0, background: '#fff', borderLeft: '1px solid rgba(0,0,0,.07)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: '#b0b0b8', marginBottom: 10 }}>Quick info</div>
            {[
              { k: 'Posted', v: job.posted },
              { k: 'Pay',    v: job.pay, green: true },
              { k: 'Type',   v: job.type },
              { k: 'Match',  v: `${score}%`, color: mc(score) },
            ].map(row => (
              <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#7a7a85' }}>{row.k}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: (row as any).color || ((row as any).green ? '#1a7a4a' : '#3d3d45') }}>{row.v}</span>
              </div>
            ))}
            {job.url
              ? <button onClick={applyToJob}
                  style={{ display: 'block', width: '100%', marginTop: 10, background: applyDone ? '#1a7a4a' : '#2f3e5c', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'sans-serif', textAlign: 'center' as const, transition: 'background .2s' }}>
                  {applyDone ? 'Applied ✓' : 'Apply Now →'}
                </button>
              : <div style={{ marginTop: 10, fontSize: 11.5, color: '#b0b0b8', fontStyle: 'italic', textAlign: 'center' as const }}>No application link</div>
            }
          </div>
          {allJobs.length === 0
            ? (
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: '#b0b0b8', marginBottom: 10 }}>Similar roles</div>
                <style>{`@keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}`}</style>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(90deg,#f0eee9 25%,#e6e3de 50%,#f0eee9 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 11, width: '75%', borderRadius: 4, background: 'linear-gradient(90deg,#f0eee9 25%,#e6e3de 50%,#f0eee9 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite', marginBottom: 5 }} />
                      <div style={{ height: 9, width: '50%', borderRadius: 4, background: 'linear-gradient(90deg,#f0eee9 25%,#e6e3de 50%,#f0eee9 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            )
            : similar.length > 0 && (
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: '#b0b0b8', marginBottom: 10 }}>Similar roles</div>
                {similar.map(sj => (
                  <div key={sj.id} onClick={() => router.push(`/jobs/${sj.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: sj.logoBg, color: sj.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontSize: 10, flexShrink: 0 }}>{sj.logo}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sj.title}</div>
                      <div style={{ fontSize: 11, color: '#7a7a85' }}>{sj.company}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: mc(sj.match), flexShrink: 0 }}>{sj.match}%</span>
                  </div>
                ))}
              </div>
            )
          }
          <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: '#b0b0b8', marginBottom: 4 }}>Ask fitted.</div>
            <div style={{ background: '#f4f2ed', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#7a7a85' }}>Quick questions about this role:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['Should I apply?', 'Salary tips', 'What to research', 'Culture fit?'].map(s => (
                <span key={s} style={{ border: '1px solid rgba(0,0,0,.1)', background: '#fff', borderRadius: 20, padding: '4px 10px', fontSize: 11, color: '#7a7a85', cursor: 'pointer' }}>{s}</span>
              ))}
            </div>
            {!isPro && (
              <div style={{ background: '#fdf3e3', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#7a7a85', marginTop: 'auto' }}>
                <span style={{ color: '#b8750a', fontWeight: 600 }}>Upgrade to Pro</span> for unlimited chat about any role.
              </div>
            )}
          </div>
        </div>

      </div>

      {showCover && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}
          onClick={() => setShowCover(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: '#1a1a1f', fontWeight: 400 }}>Cover letter</div>
                <div style={{ fontSize: 11, color: '#b0b0b8', marginTop: 3 }}>{isPro ? "Powered by fitted.'s advanced AI" : "Powered by fitted.'s fast AI"}</div>
              </div>
              <button onClick={() => setShowCover(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#7a7a85', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            {coverLoading
              ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0', color: '#7a7a85', fontSize: 13 }}>
                  <div style={{ width: 28, height: 28, border: '3px solid #eaeffe', borderTop: '3px solid #2d5be3', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Writing your cover letter…
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              : <>
                  <div style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.9, whiteSpace: 'pre-wrap', marginBottom: 18 }}>{coverLetter}</div>
                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(0,0,0,.07)', paddingTop: 14 }}>
                    <button onClick={() => navigator.clipboard?.writeText(coverLetter)}
                      style={{ background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#3d3d45', cursor: 'pointer', fontFamily: 'sans-serif' }}>Copy</button>
                    <button onClick={downloadCoverLetter}
                      style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>↓ Download</button>
                    <button onClick={() => { setCoverLetter(''); setCoverLoading(false); generateCoverLetter() }}
                      style={{ background: 'none', border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif', marginLeft: 'auto' }}>Regenerate</button>
                  </div>
                </>
            }
          </div>
        </div>
      )}

    </div>
  )
}
