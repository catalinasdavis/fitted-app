'use client'
// fitted. — main dashboard
// 3-column layout: left sidebar | job feed | right panel
// Improvements: Feedback button, Help modal, Paste a Job functional,
// What fitted. thinks collapsible, Manage Subscription wired

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getAllJobs, getJobsForField, Job } from '../lib/jobs'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface User    { email: string; id: string }
interface Profile {
  plan: string
  career_field: string | null
  about_me: string | null
  locations: string[] | null
  pay_target: string | null
  portfolio_files: any[] | null
  extra_resume_slot?: boolean
}
interface Resume {
  id: string; name: string; filename: string
  is_active: boolean; resume_text: string; created_at: string
}
interface TrackerEntry {
  id: string; job_id: string; job_title: string; job_company: string
  job_logo: string; job_logo_bg: string; job_logo_color: string
  job_pay: string; column_id: string; resume_name: string | null
  notes: string; added_at: string; deleted_at: string | null
}
interface PastedJob extends Job { isPasted: true }

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function mc(n: number) {
  if (n >= 74) return '#1a7a4a'
  if (n >= 62) return '#2d5be3'
  if (n >= 50) return '#b8750a'
  return '#7a7a85'
}
function typeTag(t: string) {
  if (t === 'Remote')  return { bg: '#e6f5ed', color: '#1a7a4a' }
  if (t === 'Hybrid')  return { bg: '#fdf3e3', color: '#b8750a' }
  return { bg: '#fdf0ec', color: '#e85d3a' }
}
function MatchRing({ pct, size = 52, stroke = 4 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const fill = (pct / 100) * circ
  const color = mc(pct)
  const cx = size / 2
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e8e4db" strokeWidth={stroke} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${fill.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color, position: 'relative', zIndex: 1 }}>{pct}%</span>
    </div>
  )
}

// ─── RESUME LIMIT LOGIC ───────────────────────────────────────────────────────
// Priority: Pro = unlimited → extra_resume_slot = 2 → Free = 1
// The $4.99 slot is permanent and survives plan changes
function getResumeLimit(profile: Profile | null, count: number) {
  if (!profile)                  return { limit: 1,        atLimit: true,       showSlotUpsell: false }
  if (profile.plan === 'pro')    return { limit: Infinity, atLimit: false,       showSlotUpsell: false }
  if (profile.extra_resume_slot) return { limit: 2,        atLimit: count >= 2, showSlotUpsell: false }
  return                                { limit: 1,        atLimit: count >= 1, showSlotUpsell: true  }
}

const TRACKER_COLS = [
  { id: 'saved',     label: 'Saved',        color: '#2d5be3', bg: '#eaeffe' },
  { id: 'applied',   label: 'Applied',      color: '#b8750a', bg: '#fdf3e3' },
  { id: 'phone',     label: 'Phone Screen', color: '#6d28d9', bg: '#ede9fe' },
  { id: 'interview', label: 'Interview',    color: '#1a7a4a', bg: '#e6f5ed' },
  { id: 'offer',     label: 'Offer 🎉',     color: '#1a7a4a', bg: '#d4edda' },
  { id: 'rejected',  label: 'Rejected',     color: '#c0392b', bg: '#fdecea' },
]

const FEEDBACK_URL = 'https://docs.google.com/forms/d/1eGLhittpd7Ez6V0rTna-us3ubkCXS_RbqDhbOseQ1jw/edit'

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()

  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [tracker, setTracker] = useState<TrackerEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [desktopView, setDesktopView] = useState<'browse' | 'tracker'>('browse')
  const [mobileTab,   setMobileTab]   = useState<'browse' | 'tracker' | 'profile'>('browse')

  const [filter,        setFilter]        = useState('all')
  const [sortBy,        setSortBy]        = useState('match')
  const [companySearch, setCompanySearch] = useState('')
  const [likedIds,      setLikedIds]      = useState<Set<string>>(new Set())
  const [dislikedIds,   setDislikedIds]   = useState<Set<string>>(new Set())
  const [pastedJobs,    setPastedJobs]    = useState<Job[]>([])

  // Right panel
  const [aboutMe,        setAboutMe]        = useState('')
  const [locations,      setLocations]      = useState<string[]>([])
  const [locInput,       setLocInput]       = useState('')
  const [payTarget,      setPayTarget]      = useState('')
  const [portfolioFiles, setPortfolioFiles] = useState<any[]>([])
  const [saveInd,        setSaveInd]        = useState('')
  const [vibesText,      setVibesText]      = useState('')
  const [analyzingVibes, setAnalyzingVibes] = useState(false)
  const [showVibes,      setShowVibes]      = useState(false)

  // Resume
  const [uploadingResume, setUploadingResume] = useState(false)
  const [renamingId,      setRenamingId]      = useState<string | null>(null)
  const [renameVal,       setRenameVal]       = useState('')

  // Modals
  const [showUpgrade,    setShowUpgrade]    = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showPaste,      setShowPaste]      = useState(false)
  const [pasteText,      setPasteText]      = useState('')
  const [pasteHint,      setPasteHint]      = useState('')
  const [parsingPaste,   setParsingPaste]   = useState(false)
  const [showHelp,       setShowHelp]       = useState(false)
  const [helpMsg,        setHelpMsg]        = useState('')
  const [helpReply,      setHelpReply]      = useState('')
  const [helpLoading,    setHelpLoading]    = useState(false)
  const [helpSent,       setHelpSent]       = useState(false)
  const [promoCode,      setPromoCode]      = useState('')
  const [promoMsg,       setPromoMsg]       = useState('')
  const [promoLoading,   setPromoLoading]   = useState(false)

  // Stripe
  const [stripeLoading,  setStripeLoading]  = useState<string | null>(null)
  const [showWelcome,    setShowWelcome]    = useState(false)
  const [welcomeField,   setWelcomeField]   = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)

  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  const isPro         = profile?.plan === 'pro'
  const limitInfo     = getResumeLimit(profile, resumes.length)
  const activeResumes = resumes.filter(r => r.is_active)

  // ── LOAD ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(async d => {
      setUser(d.user || null)
      if (d.user) {
        const [p, r, t] = await Promise.all([
          fetch('/api/profile').then(r => r.json()),
          fetch('/api/resumes').then(r => r.json()),
          fetch('/api/tracker').then(r => r.json()),
        ])
        const prof = p.profile || null
        setProfile(prof); setResumes(r.resumes || []); setTracker(t.entries || [])
        if (prof) {
          setAboutMe(prof.about_me || '')
          setLocations(prof.locations || [])
          setPayTarget(prof.pay_target || '')
          setPortfolioFiles(prof.portfolio_files || [])
        }
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // ── STRIPE SUCCESS ─────────────────────────────────────────────────────────
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search)
    // Welcome banner for new users coming from quiz
    if (params.get('welcome') === '1') {
      setShowWelcome(true)
      window.history.replaceState({}, '', '/')
    }
    const payment   = params.get('payment')
    const type      = params.get('type')
    const uid       = params.get('uid')
    const sessionId = params.get('session_id')
    if (payment === 'success' && uid && sessionId) {
      setPaymentSuccess(type || 'pro')
      fetch(`/api/stripe/create-checkout?session_id=${sessionId}&uid=${uid}&type=${type}`)
      if (type === 'resume_slot') setProfile(p => p ? { ...p, extra_resume_slot: true } : p)
      else setProfile(p => p ? { ...p, plan: 'pro' } : p)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // ── SAVE PROFILE ───────────────────────────────────────────────────────────
  const saveProfile = useCallback(async (fields: any) => {
    setSaveInd('Saving…')
    await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) })
    setSaveInd('Saved ✓'); setTimeout(() => setSaveInd(''), 2000)
  }, [])

  function onAboutMeChange(val: string) {
    setAboutMe(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveProfile({ about_me: val }), 800)
  }
  function addLocation() {
    const loc = locInput.trim()
    if (!loc || locations.includes(loc)) return
    const next = [...locations, loc]; setLocations(next); setLocInput(''); saveProfile({ locations: next })
  }
  function removeLocation(loc: string) {
    const next = locations.filter(l => l !== loc); setLocations(next); saveProfile({ locations: next })
  }
  function onPayChange(val: string) {
    setPayTarget(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveProfile({ pay_target: val }), 800)
  }

  async function analyzeVibes() {
    if (!aboutMe.trim()) return
    setAnalyzingVibes(true); setShowVibes(true)
    const res  = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `You are fitted., an AI career coach. Read this About Me and give 2-3 warm specific sentences on their goals, strengths, and ideal role/culture. About Me: ${aboutMe}`, type: 'chat', isPro: false }) })
    const data = await res.json()
    setVibesText(data.text || ''); setAnalyzingVibes(false)
  }

  // ── HELP MODAL ─────────────────────────────────────────────────────────────
  async function sendHelpMessage() {
    if (!helpMsg.trim()) return
    setHelpLoading(true); setHelpReply('')
    const res  = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `The user is on the fitted. dashboard and needs help. They said: "${helpMsg}". Give a short, friendly, specific answer about how to use fitted. — focus on the feature they mentioned. If they seem confused about something basic, explain it simply. Keep it under 3 sentences.`,
        type: 'chat', isPro: false,
      }) })
    const data = await res.json()
    setHelpReply(data.text || 'Sorry, I had trouble with that. Try submitting feedback below.')
    setHelpLoading(false); setHelpSent(true)
  }

  // ── PASTE A JOB — functional ───────────────────────────────────────────────
  async function analyzePastedJob() {
    if (!pasteText.trim() || pasteText.length < 50) { setPasteHint('Please paste the full job description.'); return }
    setParsingPaste(true); setPasteHint('')
    try {
      const res  = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Extract structured info from this job description and return ONLY a JSON object with these fields:
{
  "title": "job title",
  "company": "company name",
  "location": "city, state or Remote",
  "type": "Remote" or "Hybrid" or "On-site",
  "pay": "salary or pay range as string",
  "payNum": estimated annual salary as number in thousands (e.g. 55 for $55k),
  "description": "2 sentence summary of the role",
  "skills": [{"name": "skill1"}, {"name": "skill2"}]
}
Job description:
${pasteText}`,
          type: 'chat', isPro: false,
        }) })
      const data = await res.json()
      let parsed: any = null
      try {
        const clean = data.text.replace(/```json|```/g, '').trim()
        parsed = JSON.parse(clean)
      } catch { setPasteHint('Could not parse the job description. Try pasting more of it.'); setParsingPaste(false); return }

      const newJob: Job = {
        id:        `pasted-${Date.now()}`,
        title:     parsed.title     || 'Pasted Job',
        company:   parsed.company   || 'Unknown Company',
        location:  parsed.location  || 'Unknown',
        type:      parsed.type      || 'On-site',
        pay:       parsed.pay       || 'Not listed',
        payNum:    parsed.payNum    || 0,
        match:     75, // default match for pasted jobs
        logo:      (parsed.company || 'J').substring(0, 2).toUpperCase(),
        logoBg:    '#eaeffe',
        logoColor: '#2d5be3',
        tags:      ['pasted'],
        posted:    'Just now',
        isNew:     true,
        url:       '',
        description: parsed.description || pasteText.substring(0, 200),
        skills:    parsed.skills || [],
      }
      setPastedJobs(prev => [newJob, ...prev])
      setShowPaste(false); setPasteText(''); setPasteHint('')
    } catch { setPasteHint('Something went wrong. Please try again.') }
    setParsingPaste(false)
  }

  // ── RESUME UPLOAD ──────────────────────────────────────────────────────────
  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    if (limitInfo.atLimit) { setShowLimitModal(true); return }
    setUploadingResume(true)
    for (const file of Array.from(files)) {
      if (getResumeLimit(profile, resumes.length).atLimit) break
      const fd = new FormData(); fd.append('resume', file)
      const res  = await fetch('/api/resume', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        await fetch('/api/resumes', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name.replace(/\.[^/.]+$/, ''), filename: file.name, resume_text: data.resumeText }) })
      }
    }
    const r = await fetch('/api/resumes').then(r => r.json())
    setResumes(r.resumes || []); setUploadingResume(false)
  }

  async function toggleActive(id: string) {
    const resume = resumes.find(r => r.id === id); if (!resume) return
    await fetch('/api/resumes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !resume.is_active }) })
    const r = await fetch('/api/resumes').then(r => r.json()); setResumes(r.resumes || [])
  }
  async function deleteResume(id: string) {
    await fetch('/api/resumes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const r = await fetch('/api/resumes').then(r => r.json()); setResumes(r.resumes || [])
  }
  async function saveRename(id: string) {
    if (!renameVal.trim()) return
    await fetch('/api/resumes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name: renameVal.trim() }) })
    setRenamingId(null)
    const r = await fetch('/api/resumes').then(r => r.json()); setResumes(r.resumes || [])
  }

  // MULTIPLE ACTIVE RESUMES — auto best match per job
  function bestResume(job: Job): Resume | null {
    if (activeResumes.length === 0) return null
    if (activeResumes.length === 1) return activeResumes[0]
    const jobWords = (job.description + ' ' + job.skills.map(s => s.name).join(' '))
      .toLowerCase().split(/\W+/).filter(w => w.length > 4)
    let best: Resume | null = null; let top = -1
    for (const r of activeResumes) {
      const score = jobWords.filter(w => r.resume_text.toLowerCase().includes(w)).length
      if (score > top) { top = score; best = r }
    }
    return best
  }

  // ── TRACKER ────────────────────────────────────────────────────────────────
  async function addToTracker(job: Job, column_id = 'saved') {
    const br = bestResume(job)
    await fetch('/api/tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id, job_title: job.title, job_company: job.company,
        job_logo: job.logo, job_logo_bg: job.logoBg, job_logo_color: job.logoColor,
        job_pay: job.pay, job_url: job.url, column_id, resume_name: br?.name || null }) })
    const t = await fetch('/api/tracker').then(r => r.json()); setTracker(t.entries || [])
  }
  async function moveEntry(id: string, column_id: string) {
    await fetch('/api/tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, column_id }) })
    setTracker(prev => prev.map(e => e.id === id ? { ...e, column_id } : e))
  }
  async function softDelete(id: string) {
    const now = new Date().toISOString()
    await fetch('/api/tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, deleted_at: now }) })
    setTracker(prev => prev.map(e => e.id === id ? { ...e, deleted_at: now } : e))
  }
  async function restoreEntry(id: string) {
    await fetch('/api/tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, restore: true }) })
    setTracker(prev => prev.map(e => e.id === id ? { ...e, deleted_at: null } : e))
  }

  // ── PROMO & STRIPE ─────────────────────────────────────────────────────────
  async function redeemCode() {
    if (!promoCode.trim()) return
    setPromoLoading(true); setPromoMsg('')
    const res  = await fetch('/api/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoCode.trim() }) })
    const data = await res.json()
    if (data.success) { setProfile(p => ({ ...p!, plan: 'pro' })); setPromoMsg('✓ Pro unlocked!'); setTimeout(() => setShowUpgrade(false), 2000) }
    else setPromoMsg(data.error || 'Invalid code.')
    setPromoLoading(false)
  }
  async function startCheckout(type: 'monthly' | 'annual' | 'resume_slot' | 'portal') {
    setStripeLoading(type)
    try {
      const res  = await fetch('/api/stripe/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { alert(data.error || 'Could not start checkout. Please try again.'); setStripeLoading(null) }
    } catch { alert('Something went wrong. Please try again.'); setStripeLoading(null) }
  }

  // ── JOB DATA ───────────────────────────────────────────────────────────────
  const baseJobs: Job[] = [
    ...pastedJobs,
    ...(profile?.career_field ? getJobsForField(profile.career_field) : getAllJobs()),
  ]
  const searchedJobs = (isPro && companySearch.trim())
    ? baseJobs.filter(j => j.company.toLowerCase().includes(companySearch.toLowerCase()))
    : baseJobs
  const FILTERS      = ['all', 'remote', 'hybrid', 'brand', 'marketing']
  const filteredJobs = filter === 'all' ? searchedJobs : searchedJobs.filter(j => j.type.toLowerCase() === filter || j.tags.includes(filter))
  const sortedJobs   = [...filteredJobs].sort((a, b) => sortBy === 'pay' ? b.payNum - a.payNum : b.match - a.match)
  const activeEntries  = tracker.filter(e => !e.deleted_at)
  const trashedEntries = tracker.filter(e => e.deleted_at)

  // ── LOADING / LOGGED OUT ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#b8a99a' }}>Loading…</p>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#2f3e5c', borderRadius: '24px', padding: '48px 40px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', color: '#f4f2ed', fontSize: '80px', margin: '0 0 8px', letterSpacing: '-3px', lineHeight: 1 }}>
          fitted<span style={{ color: '#2d5be3' }}>.</span>
        </h1>
        <p style={{ color: '#b8a99a', fontSize: '18px', margin: '0 0 44px', fontFamily: 'sans-serif', fontWeight: 300 }}>
          get a career tailor-made for you
        </p>
        <a href="/auth" style={{ display: 'block', background: '#f4f2ed', color: '#2f3e5c', padding: '15px 32px', borderRadius: '50px', fontFamily: 'sans-serif', fontWeight: 700, fontSize: '15px', textDecoration: 'none', marginBottom: '12px' }}>
          Get Started
        </a>
        <a href="/auth" style={{ display: 'block', color: '#b8a99a', fontFamily: 'sans-serif', fontSize: '13px', textDecoration: 'none' }}>
          Already have an account? Sign in
        </a>
      </div>
    </div>
  )

  // ── RIGHT PANEL ────────────────────────────────────────────────────────────
  const RightPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%', boxSizing: 'border-box' as const }}>

      {/* About Me */}
      <div style={{ paddingBottom: 18, marginBottom: 18, borderBottom: '1px solid rgba(0,0,0,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 16 }}>About me</span>
          {saveInd && <span style={{ fontSize: 11, color: saveInd.includes('✓') ? '#1a7a4a' : '#b0b0b8' }}>{saveInd}</span>}
        </div>
        <textarea value={aboutMe} onChange={e => onAboutMeChange(e.target.value)}
          placeholder="Tell us about yourself — your experience, dream companies, what kind of role you want, where you want to be in 5 years…"
          style={{ width: '100%', minHeight: 88, padding: 8, border: '1px solid rgba(0,0,0,.13)', borderRadius: 6, fontFamily: 'sans-serif', fontSize: 12.5, color: '#1a1a1f', background: '#f4f2ed', resize: 'vertical', outline: 'none', lineHeight: 1.55, boxSizing: 'border-box' as const }} />
        {/* What fitted. thinks — collapsible */}
        {aboutMe.length > 30 && (
          <div style={{ marginTop: 8 }}>
            <button onClick={() => showVibes ? setShowVibes(false) : analyzeVibes()}
              style={{ background: '#eaeffe', color: '#2d5be3', border: '1px solid #2d5be3', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
              {analyzingVibes ? '…' : showVibes ? '▲ Hide' : '✦ What fitted. thinks'}
            </button>
            {showVibes && (
              <div style={{ marginTop: 8, background: '#eaeffe', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: '#185fa5', lineHeight: 1.6, animation: 'fadeIn .2s ease' }}>
                {analyzingVibes ? (
                  <span style={{ color: '#7a7a85', fontStyle: 'italic' }}>Reading your profile…</span>
                ) : vibesText || <span style={{ color: '#7a7a85', fontStyle: 'italic' }}>Click the button to analyze.</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location */}
      <div style={{ paddingBottom: 18, marginBottom: 18, borderBottom: '1px solid rgba(0,0,0,.07)' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 10 }}>Location</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: locations.length > 0 ? 10 : 0 }}>
          {locations.map(loc => (
            <div key={loc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" defaultChecked readOnly style={{ width: 14, height: 14, accentColor: '#2d5be3' }} />
              <span style={{ fontSize: 12.5, color: '#3d3d45', flex: 1 }}>{loc}</span>
              <button onClick={() => removeLocation(loc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b0b8', fontSize: 14 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input value={locInput} onChange={e => setLocInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLocation()} placeholder="Add a location…"
            style={{ flex: 1, padding: '5px 8px', border: '1px solid rgba(0,0,0,.13)', borderRadius: 6, fontFamily: 'sans-serif', fontSize: 12, color: '#1a1a1f', background: '#f4f2ed', outline: 'none' }} />
          <button onClick={addLocation} style={{ padding: '5px 10px', background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'sans-serif', fontSize: 12, cursor: 'pointer' }}>+</button>
        </div>
      </div>

      {/* Pay target */}
      <div style={{ paddingBottom: 18, marginBottom: 18, borderBottom: '1px solid rgba(0,0,0,.07)' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 10 }}>Pay target</div>
        <input value={payTarget} onChange={e => onPayChange(e.target.value)} placeholder="e.g. $26/hr or $55,000/yr"
          style={{ width: '100%', padding: '6px 9px', border: '1px solid rgba(0,0,0,.13)', borderRadius: 6, fontFamily: 'monospace', fontSize: 13, color: '#1a1a1f', background: '#f4f2ed', outline: 'none', boxSizing: 'border-box' as const, marginBottom: 6 }} />
        <div style={{ fontSize: 11.5, color: '#7a7a85' }}>Jobs below your target will be flagged.</div>
      </div>

      {/* Resume upload — mobile Profile tab only */}
      {isMobile && (
        <div style={{ paddingBottom: 18, marginBottom: 18, borderBottom: '1px solid rgba(0,0,0,.07)' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 10 }}>My Resumes</div>
          <div onClick={() => limitInfo.atLimit ? setShowLimitModal(true) : fileRef.current?.click()}
            style={{ border: '1.5px dashed rgba(0,0,0,.15)', borderRadius: 8, padding: 10, textAlign: 'center', cursor: 'pointer', marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#7a7a85' }}>
              {uploadingResume ? '⏳ Reading resume…' : '+ Upload a resume'}
              <div style={{ fontSize: 10, color: '#b0b0b8', marginTop: 2 }}>PDF · DOCX · TXT</div>
            </div>
          </div>
          {resumes.map(r => (
            <div key={r.id} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${r.is_active ? '#2d5be3' : 'rgba(0,0,0,.07)'}`, background: r.is_active ? '#eaeffe' : '#f4f2ed', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div onClick={() => toggleActive(r.id)} style={{ width: 7, height: 7, borderRadius: '50%', background: r.is_active ? '#2d5be3' : '#b0b0b8', flexShrink: 0, cursor: 'pointer' }} />
                <span style={{ fontSize: 12.5, color: r.is_active ? '#2d5be3' : '#3d3d45', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: r.is_active ? 500 : 400 }}>{r.name}</span>
                <button onClick={() => toggleActive(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.is_active ? '#2d5be3' : '#b0b0b8', fontSize: 11, padding: '0 4px', fontFamily: 'sans-serif' }}>{r.is_active ? '✓' : 'Use'}</button>
                <button onClick={() => deleteResume(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b0b8', fontSize: 14, lineHeight: 1 }}>×</button>
              </div>
            </div>
          ))}
          {!isPro && <div style={{ fontSize: 10.5, color: '#b0b0b8', textAlign: 'center', marginTop: 4 }}>{resumes.length}/{profile?.extra_resume_slot ? 2 : 1} resume{profile?.extra_resume_slot ? 's' : ' (free)'}</div>}
        </div>
      )}

      {/* Portfolio */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 16 }}>My Portfolio</span>
          {!isPro && <span onClick={() => setShowUpgrade(true)} style={{ fontSize: 11, color: '#b8750a', fontWeight: 500, background: '#fdf3e3', padding: '3px 9px', borderRadius: 20, cursor: 'pointer' }}>✦ Pro</span>}
        </div>
        {!isPro ? (
          <div style={{ textAlign: 'center', padding: '16px 8px', background: '#f4f2ed', borderRadius: 10 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>✦</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1f', marginBottom: 6 }}>Portfolio is a Pro feature</div>
            <div style={{ fontSize: 12, color: '#7a7a85', lineHeight: 1.6, marginBottom: 12 }}>Upload writing samples, moodboards, and projects. Coming soon: fitted. will analyze these to make every output sound more like you.</div>
            <button onClick={() => setShowUpgrade(true)} style={{ width: '100%', padding: 8, background: '#b8750a', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Unlock with Pro</button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: '#7a7a85', lineHeight: 1.5, marginBottom: 10 }}>Upload writing samples, moodboards, projects — anything that shows who you are beyond your resume.</div>
            <label style={{ display: 'block', border: '1.5px dashed rgba(0,0,0,.15)', borderRadius: 8, padding: '12px 10px', textAlign: 'center', cursor: 'pointer', marginBottom: 8 }}>
              <input type="file" accept="*/*" multiple style={{ display: 'none' }} onChange={e => {
                if (!e.target.files) return
                const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, type: f.type, addedAt: new Date().toISOString() }))
                const next = [...portfolioFiles, ...newFiles]; setPortfolioFiles(next); saveProfile({ portfolio_files: next })
              }} />
              <div style={{ fontSize: 12, color: '#7a7a85' }}>+ Add a file</div>
              <small style={{ fontSize: 10, color: '#b0b0b8' }}>PDF · Images · Docs · Any type</small>
            </label>
            {portfolioFiles.length === 0
              ? <p style={{ fontSize: 12, color: '#b0b0b8', fontStyle: 'italic', textAlign: 'center' }}>Nothing added yet.</p>
              : portfolioFiles.map(f => (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f4f2ed', border: '1px solid rgba(0,0,0,.07)', borderRadius: 8, marginBottom: 6 }}>
                  <span>📄</span>
                  <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button onClick={() => { const n = portfolioFiles.filter(p => p.name !== f.name); setPortfolioFiles(n); saveProfile({ portfolio_files: n }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b0b8', fontSize: 14 }}>×</button>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )

  // ── JOB CARD ───────────────────────────────────────────────────────────────
  const JobCard = ({ job }: { job: Job }) => {
    const tt         = typeTag(job.type)
    const isLiked    = likedIds.has(job.id)
    const isDisliked = dislikedIds.has(job.id)
    const isTracked  = activeEntries.some(e => e.job_id === job.id)
    const br         = bestResume(job)
    const isPasted   = job.tags.includes('pasted')
    const belowTarget = !!(payTarget && job.payNum > 0 && (() => {
      const n = parseFloat(payTarget.replace(/[^0-9.]/g, ''))
      if (!n) return false
      return job.payNum * 1000 < (payTarget.toLowerCase().includes('hr') ? n * 2080 : n)
    })())
    return (
      <div onClick={() => !isPasted && router.push(`/jobs/${job.id}`)}
        style={{ background: '#fff', border: `1px solid ${isPasted ? '#2d5be3' : belowTarget ? '#f5c6c6' : 'rgba(0,0,0,.07)'}`, borderLeft: isPasted ? '3px solid #2d5be3' : undefined, borderRadius: 14, padding: '15px 16px', cursor: isPasted ? 'default' : 'pointer', display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '0 12px', alignItems: 'start', marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 9, background: job.logoBg, color: job.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: 14, border: '1px solid rgba(0,0,0,.07)', flexShrink: 0 }}>{job.logo}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1f', lineHeight: 1.3 }}>{job.title}</span>
            {job.isNew   && <span style={{ background: '#fdf0ec', color: '#e85d3a', fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase' as const }}>New</span>}
            {isPasted    && <span style={{ background: '#eaeffe', color: '#2d5be3', fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20 }}>Pasted</span>}
            {belowTarget && <span style={{ background: '#fdecea', color: '#c0392b', fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20 }}>Below target</span>}
          </div>
          <div style={{ fontSize: 12.5, color: '#7a7a85', marginBottom: 7 }}>
            <strong style={{ color: '#3d3d45', fontWeight: 500 }}>{job.company}</strong> · {job.location} · {job.pay}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            <span style={{ background: tt.bg, color: tt.color, padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{job.type}</span>
            {job.tags.filter(t => t !== 'pasted').slice(0, 2).map(tag => (
              <span key={tag} style={{ background: '#eaeffe', color: '#2d5be3', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{tag}</span>
            ))}
            {br && activeResumes.length > 1 && (
              <span style={{ background: '#e6f5ed', color: '#1a7a4a', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 500 }}>Best: {br.name}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { const n = new Set(likedIds); isLiked ? n.delete(job.id) : n.add(job.id); setLikedIds(n) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#1a7a4a' : '#b0b0b8', fontSize: 14, padding: '2px 4px', borderRadius: 5 }}>👍</button>
            <button onClick={() => { const n = new Set(dislikedIds); isDisliked ? n.delete(job.id) : n.add(job.id); setDislikedIds(n) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDisliked ? '#c0392b' : '#b0b0b8', fontSize: 14, padding: '2px 4px', borderRadius: 5 }}>👎</button>
            <button onClick={() => addToTracker(job, 'saved')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isTracked ? '#b8750a' : '#b0b0b8', fontSize: 14, padding: '2px 4px', borderRadius: 5 }}>
              {isTracked ? '★' : '☆'}
            </button>
            <span style={{ fontSize: 10.5, color: '#b0b0b8', marginLeft: 4 }}>{job.posted}</span>
            {isPasted && (
              <button onClick={() => setPastedJobs(prev => prev.filter(j => j.id !== job.id))}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#b0b0b8', fontSize: 11, fontFamily: 'sans-serif' }}>Remove</button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <MatchRing pct={job.match} />
          <span style={{ fontSize: 9, color: '#b0b0b8', textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>match</span>
        </div>
      </div>
    )
  }

  // ── FEED VIEW ──────────────────────────────────────────────────────────────
  const FeedView = () => (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '5px 12px', border: `1px solid ${filter === f ? '#2d5be3' : 'rgba(0,0,0,.12)'}`, borderRadius: 20, fontSize: 12, color: filter === f ? '#2d5be3' : '#7a7a85', background: filter === f ? '#eaeffe' : '#fff', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: filter === f ? 500 : 400 }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {isPro && companySearch.trim() && (
        <div style={{ background: '#eaeffe', border: '1px solid #2d5be3', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#2d5be3', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Showing jobs at <strong>{companySearch}</strong></span>
          <button onClick={() => setCompanySearch('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7a7a85', fontSize: 13 }}>✕ Clear</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 19 }}>{companySearch.trim() ? `${companySearch} roles` : 'Matched for you'}</span>
          <span style={{ fontSize: 12, color: '#7a7a85', marginLeft: 8 }}>{sortedJobs.length} roles</span>
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ border: '1px solid rgba(0,0,0,.12)', borderRadius: 6, padding: '4px 8px', fontFamily: 'sans-serif', fontSize: 12, color: '#3d3d45', background: '#fff', cursor: 'pointer', outline: 'none' }}>
          <option value="match">Best match</option>
          <option value="pay">Pay ↑</option>
        </select>
      </div>
      {!companySearch.trim() && (
        <div style={{ fontSize: 12, color: '#b8750a', background: '#fdf3e3', borderRadius: 8, padding: '6px 12px', marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>✦ New matches just now</div>
      )}
      {sortedJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#7a7a85' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#3d3d45', marginBottom: 8 }}>
            {companySearch.trim() ? `No strong matches at ${companySearch} right now` : 'No jobs match this filter'}
          </div>
          <p style={{ fontSize: 13, marginBottom: 14 }}>{companySearch.trim() ? "We'll keep an eye out." : 'Try a different filter'}</p>
          <button onClick={() => { setFilter('all'); setCompanySearch('') }} style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontSize: 14, fontFamily: 'sans-serif' }}>Show all jobs</button>
        </div>
      ) : sortedJobs.map(job => <JobCard key={job.id} job={job} />)}
    </div>
  )

  // ── TRACKER VIEW ───────────────────────────────────────────────────────────
  const TrackerView = () => {
    const [showTrash, setShowTrash] = useState(false)
    const [dragId,    setDragId]    = useState<string | null>(null)
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 19 }}>My Applications</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#7a7a85' }}>{activeEntries.length} tracked</span>
            {trashedEntries.length > 0 && (
              <button onClick={() => setShowTrash(s => !s)} style={{ fontSize: 12, color: showTrash ? '#c0392b' : '#b0b0b8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                🗑 Trash ({trashedEntries.length})
              </button>
            )}
          </div>
        </div>
        {showTrash && (
          <div style={{ background: '#fdecea', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#c0392b', marginBottom: 10 }}>Deleted items — restorable within 14 days</div>
            {trashedEntries.map(e => {
              const daysLeft = Math.max(0, 14 - Math.floor((Date.now() - new Date(e.deleted_at!).getTime()) / 86400000))
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: e.job_logo_bg, color: e.job_logo_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'Georgia, serif', flexShrink: 0 }}>{e.job_logo}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.job_title}</div>
                    <div style={{ fontSize: 11, color: '#7a7a85' }}>{e.job_company} · {daysLeft}d left</div>
                  </div>
                  <button onClick={() => restoreEntry(e.id)} style={{ fontSize: 12, color: '#2d5be3', background: '#eaeffe', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'sans-serif' }}>Restore</button>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
          {TRACKER_COLS.map(col => {
            const colEntries = activeEntries.filter(e => e.column_id === col.id)
            return (
              <div key={col.id} style={{ flexShrink: 0, width: 220 }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (dragId) moveEntry(dragId, col.id) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: col.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: col.color, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{col.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: col.color, background: 'rgba(255,255,255,.7)', padding: '1px 7px', borderRadius: 20 }}>{colEntries.length}</span>
                </div>
                <div style={{ minHeight: 80, borderRadius: 10, padding: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colEntries.length === 0
                    ? <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: 12, color: '#b0b0b8', fontStyle: 'italic' }}>Drop jobs here</div>
                    : colEntries.map(e => (
                      <div key={e.id} draggable onDragStart={() => setDragId(e.id)} onDragEnd={() => setDragId(null)}
                        onClick={() => router.push(`/jobs/${e.job_id}`)}
                        style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, padding: '12px 14px', cursor: 'grab' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: e.job_logo_bg, color: e.job_logo_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'Georgia, serif', flexShrink: 0 }}>{e.job_logo}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.job_title}</div>
                            <div style={{ fontSize: 11, color: '#7a7a85' }}>{e.job_company}</div>
                          </div>
                        </div>
                        {e.resume_name && <div style={{ fontSize: 10.5, color: '#2d5be3', background: '#eaeffe', padding: '2px 7px', borderRadius: 20, display: 'inline-block', marginBottom: 6 }}>{e.resume_name}</div>}
                        <div style={{ display: 'flex', gap: 4, marginTop: 6 }} onClick={ev => ev.stopPropagation()}>
                          {TRACKER_COLS.filter(c => c.id !== col.id).slice(0, 2).map(c => (
                            <button key={c.id} onClick={() => moveEntry(e.id, c.id)}
                              style={{ flex: 1, padding: '4px', border: '1px solid rgba(0,0,0,.1)', borderRadius: 6, fontSize: 10, fontFamily: 'sans-serif', cursor: 'pointer', background: '#fff', color: '#7a7a85', textAlign: 'center' as const }}>
                              → {c.label.split(' ')[0]}
                            </button>
                          ))}
                          <button onClick={() => softDelete(e.id)} style={{ padding: '4px 8px', border: '1px solid rgba(0,0,0,.1)', borderRadius: 6, fontSize: 10, cursor: 'pointer', background: '#fff', color: '#c0392b' }}>🗑</button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f2ed', fontFamily: 'sans-serif', overflow: 'hidden' }}>

      {/* TOP NAV */}
      <nav style={{ height: 60, background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14, flexShrink: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, lineHeight: 1 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, letterSpacing: '-.02em', color: '#1a1a1f' }}>
            fitted<span style={{ color: '#2d5be3' }}>.</span>
          </span>
          <span style={{ fontSize: 11.5, color: '#b8a99a', fontFamily: 'sans-serif', fontWeight: 300, marginTop: 2 }}>
            get a career tailor-made for you
          </span>
        </div>
        <div style={{ width: 1, height: 32, background: 'rgba(0,0,0,.1)', flexShrink: 0 }} />
        {/* PRO-ONLY COMPANY SEARCH */}
        <div style={{ flex: 1, maxWidth: 460, position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#b0b0b8', pointerEvents: 'none' }}>
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9 9L12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input value={isPro ? companySearch : ''} onChange={e => isPro && setCompanySearch(e.target.value)}
            onClick={() => !isPro && setShowUpgrade(true)}
            placeholder={isPro ? 'Search companies…' : 'Search companies… (Pro)'}
            readOnly={!isPro}
            style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid rgba(0,0,0,.12)', borderRadius: 10, fontFamily: 'sans-serif', fontSize: 13, background: '#f4f2ed', color: '#1a1a1f', outline: 'none', cursor: isPro ? 'text' : 'pointer' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9 }}>
          {/* Feedback button */}
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className="hide-mobile"
            style={{ padding: '6px 12px', border: '1px solid rgba(0,0,0,.12)', borderRadius: 8, background: 'none', fontFamily: 'sans-serif', fontSize: 12, color: '#7a7a85', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M11 1.5H2C1.7 1.5 1.5 1.7 1.5 2V8.5C1.5 8.8 1.7 9 2 9H4.5V11.5L7.5 9H11C11.3 9 11.5 8.8 11.5 8.5V2C11.5 1.7 11.3 1.5 11 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Feedback
          </a>
          {isPro ? (
            <>
              <span style={{ background: '#1a7a4a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>✦ Pro</span>
              {/* Manage Subscription — opens Stripe Customer Portal */}
              <button onClick={() => startCheckout('portal')} disabled={stripeLoading === 'portal'}
                className="hide-mobile"
                style={{ padding: '6px 12px', border: '1px solid rgba(0,0,0,.12)', borderRadius: 8, background: 'none', fontFamily: 'sans-serif', fontSize: 12, color: '#7a7a85', cursor: 'pointer' }}>
                {stripeLoading === 'portal' ? '…' : 'Manage subscription'}
              </button>
            </>
          ) : (
            <button onClick={() => setShowUpgrade(true)} style={{ padding: '7px 13px', background: '#b8750a', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Upgrade</button>
          )}
          <span className="hide-mobile" style={{ fontSize: 13, color: '#7a7a85' }}>{user.email}</span>
          <button className="hide-mobile" onClick={async () => { await fetch('/api/signout', { method: 'POST' }); window.location.href = '/' }}
            style={{ padding: '7px 13px', border: '1px solid rgba(0,0,0,.12)', borderRadius: 8, background: 'none', fontFamily: 'sans-serif', fontSize: 13, color: '#7a7a85', cursor: 'pointer' }}>Sign out</button>
        </div>
      </nav>

      {/* 3-COLUMN GRID */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '230px 1fr 270px' }} className="dashboard-grid">

        {/* LEFT SIDEBAR */}
        <aside className="desktop-only" style={{ background: '#fff', borderRight: '1px solid rgba(0,0,0,.07)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '14px 8px', gap: 2 }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase' as const, color: '#b0b0b8', padding: '0 10px 4px' }}>Discover</div>
          {[
            { id: 'browse',  label: 'Browse',  count: sortedJobs.length,    bg: '#2d5be3' },
            { id: 'tracker', label: 'Tracker', count: activeEntries.length, bg: '#1a7a4a' },
          ].map(item => (
            <button key={item.id} onClick={() => setDesktopView(item.id as any)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, color: desktopView === item.id ? '#2d5be3' : '#3d3d45', fontSize: 13, cursor: 'pointer', border: 'none', background: desktopView === item.id ? '#eaeffe' : 'none', width: '100%', textAlign: 'left' as const, fontFamily: 'sans-serif', fontWeight: desktopView === item.id ? 500 : 400 }}>
              {item.label}
              {item.count > 0 && <span style={{ marginLeft: 'auto', background: item.bg, color: '#fff', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20 }}>{item.count}</span>}
            </button>
          ))}

          <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase' as const, color: '#b0b0b8', padding: '12px 10px 4px', marginTop: 4 }}>My Resumes</div>
          <div onClick={() => limitInfo.atLimit ? setShowLimitModal(true) : fileRef.current?.click()}
            style={{ border: '1.5px dashed rgba(0,0,0,.15)', borderRadius: 8, padding: 10, textAlign: 'center', cursor: 'pointer', margin: '2px 2px 4px' }}>
            <div style={{ fontSize: 12, color: uploadingResume ? '#2d5be3' : '#7a7a85', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 16 }}>{uploadingResume ? '⏳' : '+'}</span>
              <span>{uploadingResume ? 'Reading…' : 'Upload a resume'}</span>
              <small style={{ fontSize: 10, color: '#b0b0b8' }}>PDF · DOCX · TXT</small>
            </div>
          </div>
          {resumes.map(r => (
            <div key={r.id} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${r.is_active ? '#2d5be3' : 'transparent'}`, background: r.is_active ? '#eaeffe' : 'none', marginBottom: 2 }}>
              {renamingId === r.id ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input value={renameVal} onChange={e => setRenameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveRename(r.id); if (e.key === 'Escape') setRenamingId(null) }}
                    autoFocus style={{ flex: 1, padding: '3px 6px', border: '1px solid #2d5be3', borderRadius: 5, fontSize: 12, fontFamily: 'sans-serif', outline: 'none' }} />
                  <button onClick={() => saveRename(r.id)} style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, cursor: 'pointer' }}>✓</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div onClick={() => toggleActive(r.id)} style={{ width: 7, height: 7, borderRadius: '50%', background: r.is_active ? '#2d5be3' : '#b0b0b8', flexShrink: 0, cursor: 'pointer' }} title={r.is_active ? 'Active — click to deactivate' : 'Click to activate'} />
                    <span onClick={() => toggleActive(r.id)} style={{ fontSize: 12.5, color: r.is_active ? '#2d5be3' : '#3d3d45', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: r.is_active ? 500 : 400, cursor: 'pointer' }}>{r.name}</span>
                    <button onClick={() => { setRenamingId(r.id); setRenameVal(r.name) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b0b8', fontSize: 12, padding: '0 2px' }}>✎</button>
                    <button onClick={() => deleteResume(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b0b8', fontSize: 14, lineHeight: 1 }}>×</button>
                  </div>
                  <div style={{ fontSize: 10.5, color: r.is_active ? '#2d5be3' : '#b0b0b8', paddingLeft: 14, marginTop: 2, opacity: .8 }}>
                    {r.is_active ? '● Active' : '○ Inactive'}
                  </div>
                </>
              )}
            </div>
          ))}
          {activeResumes.length > 1 && (
            <div style={{ fontSize: 10.5, color: '#1a7a4a', background: '#e6f5ed', borderRadius: 6, padding: '4px 10px', margin: '4px 2px', textAlign: 'center' }}>
              {activeResumes.length} active — best match shown per job
            </div>
          )}
          {!isPro && (
            <div style={{ fontSize: 10.5, color: '#b0b0b8', padding: '4px 10px', textAlign: 'center' }}>
              {resumes.length}/{profile?.extra_resume_slot ? 2 : 1} resume{profile?.extra_resume_slot ? 's' : ' (free)'}
            </div>
          )}
          {resumes.length === 0 && <p style={{ fontSize: 11.5, color: '#b0b0b8', padding: '4px 10px', fontStyle: 'italic', lineHeight: 1.5 }}>Upload a resume and we'll find matching jobs.</p>}
          <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => router.push('/quiz')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 12px', background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%' }}>Find Jobs</button>
            <button onClick={() => setShowPaste(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 12px', background: '#f4f2ed', color: '#2d5be3', border: '1px solid #2d5be3', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, cursor: 'pointer', width: '100%' }}>Paste a Job</button>
          </div>
        </aside>

        {/* CENTER */}
        <main className="main-feed" style={{ overflowY: 'auto', padding: '18px 20px' }}>
          <div className="desktop-view">{desktopView === 'browse' ? <FeedView /> : <TrackerView />}</div>
          <div className="mobile-view" style={{ display: 'none' }}>
            {mobileTab === 'browse'  && <FeedView />}
            {mobileTab === 'tracker' && <TrackerView />}
            {mobileTab === 'profile' && <RightPanel isMobile />}
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="desktop-only" style={{ background: '#fff', borderLeft: '1px solid rgba(0,0,0,.07)', overflowY: 'auto' }}>
          <RightPanel />
        </aside>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid rgba(0,0,0,.07)', zIndex: 50, justifyContent: 'space-around', padding: '6px 0 max(6px, env(safe-area-inset-bottom))' }}>
        {[
          { id: 'tracker', label: 'Tracker', svg: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="3" width="3.5" height="14" rx="1.5" fill="currentColor" opacity=".5"/><rect x="7.5" y="2" width="3.5" height="15" rx="1.5" fill="currentColor" opacity=".8"/><rect x="13.5" y="6" width="3.5" height="11" rx="1.5" fill="currentColor"/></svg> },
          { id: 'browse',  label: 'Browse',  svg: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".8"/><rect x="13" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".8"/><rect x="2" y="13" width="7" height="7" rx="1.5" fill="currentColor" opacity=".4"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="currentColor" opacity=".4"/></svg> },
          { id: 'profile', label: 'Profile',  svg: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6"/><path d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id as any)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'sans-serif', color: mobileTab === tab.id ? '#2d5be3' : '#b0b0b8', flex: 1, padding: '4px 0' }}>
            {tab.svg}
            <span style={{ fontSize: 10, fontWeight: mobileTab === tab.id ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />

      {/* HELP BUTTON — bottom right */}
      <button onClick={() => { setShowHelp(true); setHelpMsg(''); setHelpReply(''); setHelpSent(false) }}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 44, height: 44, borderRadius: '50%', background: '#2f3e5c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,.2)', zIndex: 40 }}
        className="hide-mobile" title="Get help">
        ?
      </button>

      {/* WELCOME BANNER — shown after quiz completion */}
      {showWelcome && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#2f3e5c', color: '#f4f2ed', borderRadius: 14, padding: '16px 22px', fontSize: 14, zIndex: 200, display: 'flex', alignItems: 'flex-start', gap: 14, boxShadow: '0 4px 24px rgba(0,0,0,.18)', maxWidth: 480, width: 'calc(100vw - 48px)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, marginBottom: 5 }}>Welcome to fitted<span style={{ color: '#2d5be3' }}>.</span> ✦</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: '#b8a99a' }}>
              We've loaded a demo resume so your feed looks relevant right away. Upload your real resume anytime using the left sidebar — then you can delete the demo one.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => { setShowWelcome(false); document.querySelector<HTMLInputElement>('input[type=file]')?.click() }}
                style={{ padding: '7px 14px', background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Upload my resume →
              </button>
              <button onClick={() => setShowWelcome(false)}
                style={{ padding: '7px 14px', background: 'rgba(255,255,255,.1)', color: '#f4f2ed', border: 'none', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 12, cursor: 'pointer' }}>
                Explore first
              </button>
            </div>
          </div>
          <button onClick={() => setShowWelcome(false)} style={{ background: 'none', border: 'none', color: '#b8a99a', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}

      {/* STRIPE SUCCESS BANNER */}
      {paymentSuccess && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#1a7a4a', color: '#fff', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 500, zIndex: 200, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,.2)', whiteSpace: 'nowrap' }}>
          ✓ {paymentSuccess === 'resume_slot' ? 'Second resume slot unlocked!' : 'fitted. Pro is now active — welcome!'}
          <button onClick={() => setPaymentSuccess(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, opacity: .7, marginLeft: 4 }}>×</button>
        </div>
      )}

      {/* PASTE A JOB MODAL */}
      {showPaste && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowPaste(false); setPasteText(''); setPasteHint('') } }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 540, maxWidth: '92vw', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, marginBottom: 4 }}>Paste a Job</div>
            <div style={{ fontSize: 12.5, color: '#7a7a85', marginBottom: 16, lineHeight: 1.6 }}>Paste the full job description — title, company, requirements, everything. fitted. will parse it and add it to your feed with a match score.</div>
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste job description here…"
              style={{ width: '100%', minHeight: 150, padding: 10, border: '1px solid rgba(0,0,0,.13)', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, color: '#1a1a1f', background: '#f4f2ed', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' as const }} />
            {pasteHint && <p style={{ fontSize: 12, color: '#e85d3a', marginTop: 6 }}>{pasteHint}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPaste(false); setPasteText(''); setPasteHint('') }} style={{ padding: '8px 16px', background: 'none', border: '1px solid rgba(0,0,0,.12)', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, color: '#7a7a85', cursor: 'pointer' }}>Cancel</button>
              <button onClick={analyzePastedJob} disabled={parsingPaste}
                style={{ padding: '8px 20px', background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, cursor: parsingPaste ? 'wait' : 'pointer', opacity: parsingPaste ? .7 : 1 }}>
                {parsingPaste ? 'Analyzing…' : 'Analyze →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowHelp(false) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480, maxWidth: '92vw' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, marginBottom: 4 }}>How can we help?</div>
            <div style={{ fontSize: 12.5, color: '#7a7a85', marginBottom: 16, lineHeight: 1.6 }}>Tell us what you're trying to do and we'll walk you through it.</div>
            {!helpSent ? (
              <>
                <textarea value={helpMsg} onChange={e => setHelpMsg(e.target.value)}
                  placeholder="e.g. How do I upload a resume? / What does the match score mean? / How does the tracker work?"
                  style={{ width: '100%', minHeight: 100, padding: 10, border: '1px solid rgba(0,0,0,.13)', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, color: '#1a1a1f', background: '#f4f2ed', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' as const, marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowHelp(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid rgba(0,0,0,.12)', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, color: '#7a7a85', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={sendHelpMessage} disabled={!helpMsg.trim() || helpLoading}
                    style={{ padding: '8px 20px', background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, cursor: helpLoading ? 'wait' : 'pointer', opacity: helpLoading ? .7 : 1 }}>
                    {helpLoading ? 'Thinking…' : 'Get help →'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: '#eaeffe', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#185fa5', lineHeight: 1.7, marginBottom: 16 }}>
                  {helpReply}
                </div>
                <div style={{ fontSize: 12.5, color: '#7a7a85', marginBottom: 12 }}>Was this helpful?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowHelp(false)}
                    style={{ flex: 1, padding: '9px', background: '#e6f5ed', color: '#1a7a4a', border: 'none', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    Yes, thanks! ✓
                  </button>
                  <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: '9px', background: '#f4f2ed', color: '#2d5be3', border: '1px solid #2d5be3', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' as const }}>
                    Submit feedback →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* RESUME LIMIT MODAL */}
      {showLimitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowLimitModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, marginBottom: 8 }}>Resume limit reached</div>
            <p style={{ color: '#7a7a85', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              {profile?.extra_resume_slot ? 'You have 2 resume slots. Upgrade to Pro for unlimited.' : 'Free accounts include 1 resume. Unlock more below.'}
            </p>
            {limitInfo.showSlotUpsell && (
              <div style={{ background: '#f4f2ed', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid rgba(0,0,0,.07)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1f', marginBottom: 4 }}>$4.99 one-time</div>
                <div style={{ fontSize: 13, color: '#7a7a85', marginBottom: 12, lineHeight: 1.5 }}>Unlock a second resume slot permanently. Stays yours even if you never upgrade to Pro.</div>
                <button onClick={() => { setShowLimitModal(false); startCheckout('resume_slot') }} disabled={!!stripeLoading}
                  style={{ width: '100%', padding: 10, background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, cursor: stripeLoading ? 'wait' : 'pointer', opacity: stripeLoading ? .7 : 1 }}>
                  {stripeLoading === 'resume_slot' ? 'Redirecting…' : 'Unlock second slot — $4.99'}
                </button>
              </div>
            )}
            <div style={{ background: '#fdf3e3', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid rgba(0,0,0,.07)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#b8750a', marginBottom: 4 }}>fitted. Pro — $9/mo</div>
              <div style={{ fontSize: 13, color: '#7a7a85', marginBottom: 12, lineHeight: 1.5 }}>Unlimited resumes plus salary scripts, career path, interview feedback, and more.</div>
              <button onClick={() => { setShowLimitModal(false); setShowUpgrade(true) }}
                style={{ width: '100%', padding: 10, background: '#b8750a', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Upgrade to Pro
              </button>
            </div>
            <button onClick={() => setShowLimitModal(false)} style={{ width: '100%', padding: 10, background: 'none', border: '1px solid rgba(0,0,0,.12)', borderRadius: 10, fontFamily: 'sans-serif', fontSize: 13, color: '#7a7a85', cursor: 'pointer' }}>Maybe later</button>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgrade && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowUpgrade(false) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1a1a1f', margin: '0 0 6px' }}>fitted<span style={{ color: '#2d5be3' }}>.</span> Pro</h2>
            <p style={{ color: '#7a7a85', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>Unlock salary scripts, career path, interview feedback, company search, portfolio uploads, and unlimited resumes.</p>
            <div style={{ background: '#f4f2ed', borderRadius: 12, padding: 16, marginBottom: 22 }}>
              {['Unlimited resumes', 'Salary negotiation scripts', 'Career path & milestones', 'Interview answer feedback', 'AI-powered tailor suggestions', 'Unlimited chat', 'Portfolio uploads', 'Company search'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, color: '#3d3d45' }}>
                  <span style={{ color: '#1a7a4a', fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <button onClick={() => startCheckout('annual')} disabled={!!stripeLoading}
                style={{ width: '100%', padding: '13px 16px', background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'sans-serif', fontSize: 14, fontWeight: 600, cursor: stripeLoading ? 'wait' : 'pointer', textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: stripeLoading && stripeLoading !== 'annual' ? .5 : 1 }}>
                <div>
                  <div>{stripeLoading === 'annual' ? 'Redirecting to checkout…' : '$89 / year'}</div>
                  <div style={{ fontSize: 11, opacity: .8, fontWeight: 400, marginTop: 2 }}>Best value — save 17% vs monthly</div>
                </div>
                {stripeLoading !== 'annual' && <span style={{ background: '#fff', color: '#2d5be3', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>BEST VALUE</span>}
              </button>
              <button onClick={() => startCheckout('monthly')} disabled={!!stripeLoading}
                style={{ width: '100%', padding: '13px 16px', background: '#2f3e5c', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'sans-serif', fontSize: 14, fontWeight: 600, cursor: stripeLoading ? 'wait' : 'pointer', textAlign: 'left' as const, opacity: stripeLoading && stripeLoading !== 'monthly' ? .5 : 1 }}>
                <div>{stripeLoading === 'monthly' ? 'Redirecting to checkout…' : '$9 / month'}</div>
                <div style={{ fontSize: 11, opacity: .8, fontWeight: 400, marginTop: 2 }}>Cancel anytime</div>
              </button>
            </div>
            {!isPro && !profile?.extra_resume_slot && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.08)' }} />
                  <span style={{ fontSize: 11, color: '#b0b0b8', whiteSpace: 'nowrap' }}>just need one more resume?</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.08)' }} />
                </div>
                <button onClick={() => { setShowUpgrade(false); startCheckout('resume_slot') }} disabled={!!stripeLoading}
                  style={{ width: '100%', padding: '11px 14px', background: '#f4f2ed', color: '#2d5be3', border: '1.5px solid #2d5be3', borderRadius: 10, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, cursor: stripeLoading ? 'wait' : 'pointer', marginBottom: 16, textAlign: 'left' as const, opacity: stripeLoading ? .7 : 1 }}>
                  <div>{stripeLoading === 'resume_slot' ? 'Redirecting…' : '$4.99 one-time — Unlock second resume slot'}</div>
                  <div style={{ fontSize: 11, color: '#7a7a85', fontWeight: 400, marginTop: 2 }}>No subscription. Permanent.</div>
                </button>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.08)' }} />
              <span style={{ fontSize: 11, color: '#b0b0b8' }}>Have a promo code?</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.08)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && redeemCode()} placeholder="Enter code"
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e8e4db', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, letterSpacing: '.08em', outline: 'none', color: '#1a1a1f', background: '#f4f2ed' }} />
              <button onClick={redeemCode} disabled={promoLoading || !!stripeLoading}
                style={{ padding: '10px 18px', background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: promoLoading ? .6 : 1 }}>
                {promoLoading ? '…' : 'Apply'}
              </button>
            </div>
            {promoMsg && <p style={{ fontSize: 13, color: promoMsg.startsWith('✓') ? '#1a7a4a' : '#e85d3a', margin: '0 0 16px' }}>{promoMsg}</p>}
            <button onClick={() => setShowUpgrade(false)} style={{ width: '100%', padding: 11, background: 'none', border: '1.5px solid #e8e4db', borderRadius: 10, fontSize: 13, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif' }}>Maybe later</button>
          </div>
        </div>
      )}

      {/* RESPONSIVE STYLES */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @media (min-width: 769px) {
          .desktop-only       { display: flex !important; flex-direction: column; }
          .desktop-view       { display: block !important; }
          .mobile-view        { display: none !important; }
          .mobile-bottom-nav  { display: none !important; }
          .hide-mobile        { display: inline-flex !important; }
        }
        @media (max-width: 768px) {
          .dashboard-grid     { grid-template-columns: 1fr !important; }
          .desktop-only       { display: none !important; }
          .desktop-view       { display: none !important; }
          .mobile-view        { display: block !important; }
          .mobile-bottom-nav  { display: flex !important; }
          .main-feed          { padding-bottom: 80px !important; }
          .hide-mobile        { display: none !important; }
        }
      `}</style>
    </div>
  )
}
