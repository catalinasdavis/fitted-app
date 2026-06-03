'use client'
// fitted. — Quiz Page
// 4-question onboarding quiz.
// Q1: gender — selects demo resume persona (female-coded for woman/nonbinary/skip, male-coded for man)
// Q2: career stage — saved to profile as career_stage
// Q3: field — routes demo resume + saved as career_field
// Q4: priority — saved to profile; auto-advances on selection

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDemoResume } from '../../lib/demo-resumes'

// ─── QUIZ DATA ────────────────────────────────────────────────────────────────

const Q1 = {
  question: 'How do you identify?',
  sub: "We use this to load a more relevant demo resume. You can skip it — we'll never use it beyond that.",
  options: [
    { id: 'woman',     emoji: '👩', label: 'Woman' },
    { id: 'man',       emoji: '👨', label: 'Man' },
    { id: 'nonbinary', emoji: '🧑', label: 'Non-binary / Other' },
    { id: 'skip',      emoji: '—',  label: 'Prefer not to say' },
  ],
}

const Q2 = {
  question: 'Where are you right now?',
  sub: "This helps us surface the right roles — wherever you're starting from, or coming back to.",
  options: [
    { id: 'college',   emoji: '🎓', label: 'Still in college' },
    { id: 'recent',    emoji: '📄', label: 'Recent grad (last 2 years)' },
    { id: 'working',   emoji: '💼', label: 'Already working, looking for something better' },
    { id: 'changing',  emoji: '🔄', label: 'Changing careers or industries' },
    { id: 'returning', emoji: '🌿', label: 'Returning after a career break or time away' },
  ],
}

const Q3 = {
  question: 'What field are you heading into?',
  sub: "We'll load a demo resume in this area so your feed looks relevant right away.",
  options: [
    { id: 'marketing',   emoji: '📣', label: 'Marketing, Brand & Communications' },
    { id: 'business',    emoji: '💰', label: 'Business, Sales & Partnerships' },
    { id: 'tech',        emoji: '💻', label: 'Tech & Operations' },
    { id: 'creative',    emoji: '🎨', label: 'Creative & Design' },
    { id: 'healthcare',  emoji: '🏥', label: 'Healthcare & Science' },
    { id: 'legal',       emoji: '⚖️', label: 'Legal, Policy & Government' },
    { id: 'engineering', emoji: '🏗️', label: 'Engineering & Architecture' },
    { id: 'finance',     emoji: '💵', label: 'Finance & Accounting' },
    { id: 'hr',          emoji: '🤝', label: 'Human Resources & People Ops' },
    { id: 'nonprofit',   emoji: '🌍', label: 'Nonprofit, Education & Social Impact' },
  ],
}

const Q4 = {
  question: 'What matters most to you right now?',
  sub: "We'll use this to personalize your feed and the way we talk about roles.",
  options: [
    { id: 'pay',       emoji: '💸', label: 'Strong compensation and financial growth' },
    { id: 'remote',    emoji: '🏠', label: 'Flexibility — remote, hybrid, or on my terms' },
    { id: 'growth',    emoji: '📈', label: 'Building real momentum in my career' },
    { id: 'change',    emoji: '🔀', label: 'Making a real pivot — field, industry, or direction' },
    { id: 'values',    emoji: '🌱', label: 'Finding work that actually fits my life' },
    { id: 'exploring', emoji: '🗺️', label: "Just seeing what's actually out there for me" },
  ],
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '32px 28px',
  maxWidth: 560,
  width: '100%',
  border: '1px solid rgba(0,0,0,.07)',
}

function optBtn(selected: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '13px 16px',
    border: `1.5px solid ${selected ? '#2f3e5c' : 'rgba(0,0,0,.1)'}`,
    borderRadius: 10,
    background: selected ? '#e8edf5' : '#fff',
    cursor: 'pointer',
    fontFamily: 'sans-serif',
    fontSize: 14,
    color: selected ? '#2f3e5c' : '#1a1a1f',
    textAlign: 'left' as const,
    fontWeight: selected ? 500 : 400,
  }
}

const nextBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px',
  background: '#2f3e5c',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontFamily: 'sans-serif',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 8,
}

const skipStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#b0b0b8',
  fontFamily: 'sans-serif',
  fontSize: 13,
  cursor: 'pointer',
  marginTop: 10,
  textAlign: 'center' as const,
  width: '100%',
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const router = useRouter()
  const [step,       setStep]       = useState<1|2|3|4>(1)
  const [q1,         setQ1]         = useState('')   // gender
  const [q2,         setQ2]         = useState('')   // career stage
  const [q3,         setQ3]         = useState('')   // field
  const [loading,    setLoading]    = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error,      setError]      = useState('')

  const progress = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100

  // ── FINISH — save profile + load demo resume + redirect ───────────────────
  async function finish(finalQ4: string) {
    setLoading(true)
    setError('')

    const gender = q1 || 'skip'
    const field  = q3 || 'marketing'
    const demo   = getDemoResume(field, gender)

    try {
      setLoadingMsg('Saving your preferences…')

      // 1. Save career info to profile
      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          career_field: field,
          career_stage: q2 || 'recent',
          priority:     finalQ4,
        }),
      })
      if (!profileRes.ok) throw new Error('Could not save your profile.')

      setLoadingMsg(`Loading ${demo.name}'s resume as your demo…`)

      // 2. Load demo resume into the resumes table
      const resumeRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        `${demo.name} (Demo)`,
          filename:    `${demo.id}.txt`,
          resume_text: demo.resumeText,
        }),
      })
      if (!resumeRes.ok) throw new Error('Could not load demo resume.')

      setLoadingMsg('Setting up your dashboard…')

      // 3. Small pause so user sees the message, then redirect
      await new Promise(r => setTimeout(r, 600))
      router.push('/home?welcome=1')

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false); setLoadingMsg('')
    }
  }

  // ── LOADING SCREEN ────────────────────────────────────────────────────────
  if (loading) {
    const gender = q1 || 'skip'
    const field  = q3 || 'marketing'
    const demo   = getDemoResume(field, gender)
    return (
      <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1a1a1f', marginBottom: 8 }}>
              Setting up your feed<span style={{ color: '#2f3e5c' }}>.</span>
            </div>
            <p style={{ fontSize: 13.5, color: '#7a7a85', lineHeight: 1.7, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
              We're loading a demo resume so your feed looks real from day one. Swap it for yours any time — it takes about 30 seconds.
            </p>
            <div style={{ background: '#f4f2ed', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 10.5, color: '#b0b0b8', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Your demo resume</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#2f3e5c', marginBottom: 2 }}>{demo.name}</div>
              <div style={{ fontSize: 13, color: '#7a7a85' }}>{demo.title} · {demo.school}, {demo.gradYear}</div>
            </div>
            <div style={{ fontSize: 13, color: '#b8a99a', marginBottom: 16 }}>{loadingMsg}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#2f3e5c', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50%       { opacity: 1;   transform: scale(1.3); }
          }
        `}</style>
      </div>
    )
  }

  // ── QUIZ LAYOUT ───────────────────────────────────────────────────────────
  const currentQ   = step === 1 ? Q1 : step === 2 ? Q2 : step === 3 ? Q3 : Q4
  const currentVal = step === 1 ? q1 : step === 2 ? q2 : step === 3 ? q3 : ''

  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: 'sans-serif' }}>

      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1a1a1f', letterSpacing: '-.02em' }}>
          fitted<span style={{ color: '#5171bf' }}>.</span>
        </div>
        <div style={{ fontSize: 12.5, color: '#b8a99a', fontWeight: 300, marginTop: 4 }}>
          work that actually fits your life
        </div>
      </div>

      <div style={cardStyle}>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#b0b0b8' }}>Question {step} of 4</span>
            <span style={{ fontSize: 12, color: '#b0b0b8' }}>{progress}%</span>
          </div>
          <div style={{ height: 4, background: '#e8e4db', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#2f3e5c', borderRadius: 20, transition: 'width .3s ease' }} />
          </div>
        </div>

        {/* Question */}
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1a1a1f', margin: '0 0 6px', fontWeight: 400 }}>
          {currentQ.question}
        </h2>
        <p style={{ fontSize: 13.5, color: '#7a7a85', margin: '0 0 20px', lineHeight: 1.6 }}>
          {currentQ.sub}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: step === 3 ? 380 : 'none', overflowY: step === 3 ? 'auto' : 'visible', paddingRight: step === 3 ? 4 : 0 }}>
          {currentQ.options.map(opt => (
            <button key={opt.id}
              onClick={() => {
                if (step === 1) { setQ1(opt.id); setStep(2) }
                if (step === 2) { setQ2(opt.id) }
                if (step === 3) { setQ3(opt.id) }
                if (step === 4) { finish(opt.id) }
              }}
              style={optBtn(currentVal === opt.id)}>
              <span style={{ fontSize: opt.id === 'skip' ? 14 : 20, flexShrink: 0, color: opt.id === 'skip' ? '#b0b0b8' : 'inherit' }}>{opt.emoji}</span>
              <span style={{ flex: 1 }}>{opt.label}</span>
              {currentVal === opt.id && <span style={{ color: '#2f3e5c', fontSize: 16, flexShrink: 0 }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <p style={{ fontSize: 13, color: '#e85d3a', marginBottom: 12 }}>{error}</p>}

        {/* Next button — Q2 and Q3 only (Q1 and Q4 auto-advance on selection) */}
        {(step === 2 || step === 3) && (
          <button
            onClick={() => setStep(prev => (prev + 1) as 1|2|3|4)}
            disabled={!currentVal}
            style={{ ...nextBtnStyle, opacity: currentVal ? 1 : .4, cursor: currentVal ? 'pointer' : 'not-allowed' }}>
            Next →
          </button>
        )}

        {/* Navigation row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
          {step > 1 && (
            <button onClick={() => setStep(prev => (prev - 1) as 1|2|3|4)} style={{ ...skipStyle, width: 'auto', color: '#7a7a85' }}>
              ← Back
            </button>
          )}
          <button
            onClick={() => {
              if (step === 1) { setQ1('skip'); setStep(2) }
              else if (step === 2) { if (!q2) setQ2('recent'); setStep(3) }
              else if (step === 3) { if (!q3) setQ3('marketing'); setStep(4) }
              else { finish('exploring') }
            }}
            style={{ ...skipStyle, width: 'auto' }}>
            {step === 4 ? 'Skip — take me to my dashboard' : 'Skip'}
          </button>
        </div>
      </div>

      {/* Already have a real resume? */}
      <p style={{ marginTop: 20, fontSize: 12.5, color: '#b0b0b8', textAlign: 'center' }}>
        Already have a real resume?{' '}
        <a href="/home" style={{ color: '#2f3e5c', textDecoration: 'none' }}>
          Skip the quiz and go straight to your dashboard →
        </a>
      </p>
    </div>
  )
}
