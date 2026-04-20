'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getJob, getSimilarJobs, Job } from '../../../lib/jobs'

interface Profile { plan: string; about_me: string | null; career_field: string | null; pay_target: string | null }
interface Resume { id: string; name: string; resume_text: string; is_active: boolean }
interface User { email: string; id: string }

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

  const [emailType,    setEmailType]    = useState<'apply'|'followup'|'thankyou'|'checkin'>('apply')
  const [prepAnswers,  setPrepAnswers]  = useState<Record<number,string>>({})
  const [prepFeedback, setPrepFeedback] = useState<Record<number,string>>({})
  const [prepLoading,  setPrepLoading]  = useState<Record<number,boolean>>({})

  useEffect(() => {
    const j = getJob(jobId)
    setJob(j || null)
    Promise.all([
      fetch('/api/me').then(r => r.json()).catch(() => ({})),
      fetch('/api/profile').then(r => r.json()).catch(() => ({})),
      fetch('/api/resumes').then(r => r.json()).catch(() => ({})),
    ]).then(([me, p, r]) => {
      if (me?.user)   setUser(me.user)
      if (p?.profile) setProfile(p.profile)
      if (r?.resumes) setResumes(r.resumes)
      setDataReady(true)
    })
  }, [jobId])

  useEffect(() => {
    if (dataReady && job && !matchDone.current && !matchLoading) runMatch()
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
    const prompt = `You are simultaneously a senior hiring manager at ${job.company} who has reviewed thousands of resumes, and a career coach who is deeply invested in helping this specific person land this specific job. Your job is to give them the most honest, useful, specific analysis possible — not generic advice.

Job: ${job.title} at ${job.company}
Description: ${job.description.substring(0, 900)}
Required skills: ${(job as any).skills?.map((s: any) => s.name).join(', ') || 'See description'}

Candidate resume:
${resumeText}

About Me: ${aboutMe}
Career field: ${profile?.career_field || 'not specified'}

Write a professional analysis using exactly these four bold headings, each followed by one focused paragraph. Reference specific details from their actual resume and About Me — nothing generic:

**Resume-to-Role Match**
[Be direct about how well this resume actually matches. Name specific skills or experience that align or are missing.]

**Culture & Values Alignment**
[Assess fit based on what they've shared about themselves and what you know about ${job.company}.]

**Hiring Manager Verdict**
[Speak as the hiring manager. Would this resume get an interview? What would make you hesitate?]

**What to Emphasize**
[Give the candidate 2-3 concrete things to lead with in their application and interviews.]

Do not use asterisks inside paragraphs. Do not ask them to do anything. Be warm but honest — this person is trying to get a job.`
    const text = await callAI(prompt)
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

Return ONLY a valid JSON array. No markdown, no code fences, no explanation before or after. Just the raw JSON:
[{"priority":"HIGH","section":"exact section name from resume","original":"the actual current text or gap","tailored":"the improved version with specific language","why":"specific reason this edit helps with this job","talkAboutIt":"one sentence on how to reference this in an interview"},{"priority":"MEDIUM","section":"exact section name","original":"current text or gap","tailored":"improved version","why":"specific reason","talkAboutIt":"interview tie-back"},{"priority":"LOW","section":"exact section name","original":"current text or gap","tailored":"improved version","why":"specific reason","talkAboutIt":"interview tie-back"}]

Priority HIGH = biggest impact on ATS and recruiter attention. Be specific to this actual resume and this actual job — not generic advice.`
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
  }

  async function runStandout() {
    if (standoutDone.current || standoutLoading || !job) return
    standoutDone.current = true
    setStandoutLoading(true)
    const br = bestResume(resumes)
    const prompt = `You are a career coach helping a specific person stand out for ${job.title} at ${job.company}. This is not generic advice — it is tailored to this person and this company.

Job: ${job.description.substring(0, 500)}
About them: ${profile?.about_me?.trim() || 'not provided'}
Resume excerpt: ${br ? br.resume_text.substring(0, 600) : 'none uploaded'}

Return ONLY valid JSON. No markdown, no code fences:
{"tips":["specific tip 1 referencing their actual background","specific tip 2","specific tip 3","specific tip 4"],"whyYou":"2-3 sentences on exactly why this specific person is a strong fit for this specific role — reference their actual experience and ${job.company}'s known culture or work","email":{"subject":"compelling subject line personalized to this role","body":"full outreach email that sounds like a real person wrote it — warm, specific, confident. Include [brackets] for any spots they should personalize further."}}`
    try {
      const raw = await callAI(prompt, 'standout')
      const clean = raw.replace(/```json|```/g, '').trim()
      const start = clean.indexOf('{')
      const end   = clean.lastIndexOf('}')
      setStandoutAI(start !== -1 && end !== -1 ? JSON.parse(clean.substring(start, end + 1)) : null)
    } catch { setStandoutAI(null) }
    setStandoutLoading(false)
  }

  async function getPrepFeedback(idx: number, question: string) {
    const answer = prepAnswers[idx] || ''
    if (!answer.trim()) { setPrepFeedback(p => ({ ...p, [idx]: 'Write your answer first.' })); return }
    setPrepLoading(p => ({ ...p, [idx]: true }))
    const prompt = `You are a career coach and former hiring manager. Give honest, specific feedback on this interview answer in 2-3 sentences. What's strong, what would make a hiring manager hesitate, and what one thing would make it stronger. Be direct — this person is trying to get a job.

Question: "${question}"
Their answer: "${answer}"`
    const text = await callAI(prompt)
    setPrepFeedback(p => ({ ...p, [idx]: text }))
    setPrepLoading(p => ({ ...p, [idx]: false }))
  }

  function handleTab(t: typeof tab) {
    setTab(t)
    if (t === 'tailor'   && !tailorDone.current   && !tailorLoading)   runTailor()
    if (t === 'standout' && !standoutDone.current && !standoutLoading) runStandout()
  }

  async function signOut() {
    await fetch('/api/signout', { method: 'POST' })
    window.location.href = '/'
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

  const similar = getSimilarJobs(job)
  const br      = bestResume(resumes)
  const isPro   = profile?.plan === 'pro'
  const score   = job.match

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

  const prepQuestions = [
    { q: `Tell me about a time you represented a brand or organization in a high-stakes situation.` },
    { q: `How do you maintain consistency across multiple channels or stakeholders?` },
    { q: `Why ${job.company} specifically — what draws you to this organization?` },
    { q: `Walk me through a project where you communicated complex information clearly.` },
    { q: `Where do you see yourself in three years?` },
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
        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer"
            style={{ background: '#2d5be3', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Apply Now →
          </a>
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
                : <button onClick={() => { setShowMenu(false); router.push('/') }} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: 13, color: '#b8750a', cursor: 'pointer', fontFamily: 'sans-serif' }}>✦ Upgrade to Pro</button>
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
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ background: job.type === 'Remote' ? '#e6f5ed' : '#fdf3e3', color: job.type === 'Remote' ? '#1a7a4a' : '#b8750a', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{job.type}</span>
            <span style={{ background: '#eaeffe', color: '#185fa5', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{score}% Resume Match</span>
            {br && <span style={{ background: '#e6f5ed', color: '#1a7a4a', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>Using: {br.name}</span>}
            {isPro && <span style={{ background: '#1a7a4a', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✦ Pro</span>}
            <span style={{ background: '#f4f2ed', color: '#7a7a85', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
              {isPro ? 'Powered by fitted.\'s advanced AI' : 'Powered by fitted.\'s fast AI'}
            </span>
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
                  { label: 'Resume Match', value: score, note: 'Based on your best resume' },
                  { label: 'Personal Fit', value: (job as any).personalFit || Math.max(50, score - 5), note: 'Based on About Me & profile' },
                  { label: 'Likeliness',   value: (job as any).likeliness  || Math.max(45, score - 8), note: 'Likelihood of progressing' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f4f2ed', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: mc(s.value), letterSpacing: -1, lineHeight: 1 }}>{s.value}%</div>
                    <div style={{ fontSize: 10, color: '#b0b0b8', textTransform: 'uppercase' as const, letterSpacing: '.06em', marginTop: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: '#b0b0b8', marginTop: 2 }}>{s.note}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #2d5be3', borderRadius: '0 10px 10px 0', padding: '18px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 4 }}>✦ fitted. coach analysis</div>
                <div style={{ fontSize: 10, color: '#b0b0b8', marginBottom: 14 }}>{isPro ? 'Powered by fitted.\'s advanced AI' : 'Powered by fitted.\'s fast AI'}</div>
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
                              <div style={{ background: '#f4f2ed', borderRadius: 6, padding: '8px 10px' }}>
                                <div style={{ fontSize: 9, fontWeight: 600, color: '#a32d2d', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>Original</div>
                                <div style={{ fontSize: 12, color: '#7a7a85', lineHeight: 1.5 }}>{item.original}</div>
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
                        <button style={{ flex: 1, background: '#f4f2ed', color: '#3d3d45', border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, padding: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>✦ Generate cover letter</button>
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
              <p style={{ fontSize: 13, color: '#7a7a85', marginBottom: 20, lineHeight: 1.6 }}>
                Likely questions for this role — write your answer, then get feedback.{' '}
                {!isPro && <span style={{ background: '#fdf3e3', color: '#b8750a', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>✦ Pro unlocks answer feedback</span>}
              </p>
              {prepQuestions.map((q, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: 16, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#b0b0b8', marginBottom: 6 }}>Question {i + 1}</div>
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
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 20, color: '#1a1a1f', margin: '0 0 8px', fontWeight: 400 }}>Salary negotiation ✦</h3>
                {isPro
                  ? <>
                      <p style={{ fontSize: 13, color: '#7a7a85', marginBottom: 20, lineHeight: 1.6 }}>Scripts for negotiating at <strong style={{ color: '#3d3d45' }}>{job.company}</strong>.</p>
                      {[
                        { stage: 'When they ask your expectations', script: `"I'm open based on the full picture. Could you share the budgeted range?"`, note: `Don't name a number first. If they push: "I'd want to be in the range that reflects the scope of this role."` },
                        { stage: 'When they give you a number', script: `"Based on my experience, I was thinking closer to [top third + 10%]. Is there flexibility?"`, note: `For ${job.pay}, aim for the high end. Never accept on the spot.` },
                        { stage: 'If the range is firm', script: `"Is there flexibility on start date, title, remote days, or a 90-day review?"`, note: `PTO, title, and reviews are negotiable even when base pay isn't.` },
                        { stage: 'Never say', script: `"I really need this job" or "I'll take whatever you're offering."`, note: `It transfers all the power. Stay warm, stay confident.`, danger: true },
                      ].map((item, i) => (
                        <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{item.stage}</div>
                          <div style={{ background: (item as any).danger ? '#fdecea' : '#eaeffe', color: (item as any).danger ? '#a32d2d' : '#185fa5', borderRadius: 6, padding: '10px 12px', fontSize: 13, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8 }}>{item.script}</div>
                          <p style={{ fontSize: 12.5, color: '#7a7a85', margin: 0, lineHeight: 1.5 }}>{item.note}</p>
                        </div>
                      ))}
                    </>
                  : <div style={{ position: 'relative', minHeight: 180, borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ filter: 'blur(4px)', opacity: .4, pointerEvents: 'none', padding: 16 }}>
                        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ fontSize: 11, color: '#b0b0b8', marginBottom: 6, textTransform: 'uppercase' as const }}>When they ask your expectations</div>
                          <div style={{ background: '#eaeffe', borderRadius: 6, padding: 8, fontSize: 12, fontStyle: 'italic' }}>Don't name a number first…</div>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(248,246,241,.88)' }}>
                        <div style={{ fontSize: 20, color: '#b8750a' }}>✦</div>
                        <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, color: '#1a1a1f' }}>Pro feature</div>
                        <div style={{ fontSize: 12, color: '#7a7a85', textAlign: 'center', maxWidth: 220, lineHeight: 1.5 }}>Exact scripts for every negotiation stage, tailored to this role and company.</div>
                        <button onClick={() => router.push('/')} style={{ background: '#b8750a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>Unlock with Pro</button>
                      </div>
                    </div>
                }
              </div>
            </div>
          )}

          {tab === 'career' && (
            !isPro
              ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, color: '#b8750a' }}>✦</div>
                  <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: '#1a1a1f', fontWeight: 400 }}>Career Path is a Pro feature</h3>
                  <p style={{ fontSize: 13, color: '#7a7a85', maxWidth: 280, lineHeight: 1.6 }}>See how this role fits into a realistic path from where you are now to where you want to be — with salary milestones.</p>
                  <button onClick={() => router.push('/')} style={{ background: '#b8750a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>Unlock with Pro</button>
                </div>
              : <div>
                  <p style={{ fontSize: 13, color: '#7a7a85', marginBottom: 20, lineHeight: 1.6 }}>How <strong style={{ color: '#3d3d45' }}>{job.title}</strong> fits a realistic career path.</p>
                  {[
                    { stage: 'Where you are', role: 'Current role', pay: 'Varies', dot: '#2d5be3' },
                    { stage: 'This role',     role: job.title,      pay: job.pay,  dot: '#1a7a4a' },
                    { stage: '2 years out',   role: 'Senior Coordinator / Manager', pay: '$55–75k/yr', dot: '#1a7a4a' },
                    { stage: '5 years out',   role: 'Senior Manager / Director',    pay: '$80–120k/yr', dot: '#6d28d9' },
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
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Your thoughts — questions to ask, things to research, why this feels right or wrong…"
                style={{ width: '100%', minHeight: 280, padding: 14, border: '1px solid rgba(0,0,0,.1)', borderRadius: 10, fontFamily: 'sans-serif', fontSize: 13.5, color: '#1a1a1f', background: '#fff', resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' as const }} />
              <p style={{ fontSize: 12, color: '#b0b0b8', marginTop: 6 }}>Notes save locally in this session.</p>
            </div>
          )}

          {tab === 'rejected' && (
            !isPro
              ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, color: '#b8750a' }}>✦</div>
                  <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: '#1a1a1f', fontWeight: 400 }}>Why Rejected is a Pro feature</h3>
                  <p style={{ fontSize: 13, color: '#7a7a85', maxWidth: 280, lineHeight: 1.6 }}>Get analysis of what likely happened and a polite email to request real feedback from the hiring team.</p>
                  <button onClick={() => router.push('/')} style={{ background: '#b8750a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>Unlock with Pro</button>
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
            {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2d5be3', textDecoration: 'none', display: 'block', marginTop: 8 }}>View original listing →</a>}
          </div>
          {similar.length > 0 && (
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
          )}
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
    </div>
  )
}
