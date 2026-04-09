'use client'
// fitted. — Quiz Page
// Light 3-question onboarding quiz.
// Routes to one of 10 demo resumes based on field (Q2).
// Saves career_field + career_stage + priority to profile.
// Loads demo resume into /api/resumes, then redirects to /?welcome=1

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDemoResume } from '../../lib/demo-resumes'

// ─── QUIZ DATA ────────────────────────────────────────────────────────────────

const Q1 = {
  question: 'Where are you right now?',
  sub: 'This helps us show you the most relevant roles and resources.',
  options: [
    { id: 'college',   emoji: '🎓', label: 'Still in college' },
    { id: 'recent',    emoji: '📄', label: 'Recent grad (last 2 years)' },
    { id: 'working',   emoji: '💼', label: 'Already working, looking for something better' },
    { id: 'changing',  emoji: '🔄', label: 'Changing careers or industries' },
    { id: 'returning', emoji: '⏸️', label: 'Returning to work after a break' },
  ],
}

const Q2 = {
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

const Q3 = {
  question: 'What matters most to you right now?',
  sub: "We'll use this to sort your job feed and personalize your experience.",
  options: [
    { id: 'pay',       emoji: '💸', label: 'Finding something that pays well' },
    { id: 'remote',    emoji: '🏠', label: 'Working remotely or having flexibility' },
    { id: 'growth',    emoji: '📈', label: 'Growing fast in my career' },
    { id: 'change',    emoji: '🔀', label: 'Making a career change' },
    { id: 'exploring', emoji: '🗺️', label: "Just figuring out what's out there" },
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
    border: `1.5px solid ${selected ? '#2d5be3' : 'rgba(0,0,0,.1)'}`,
    borderRadius: 10,
    background: selected ? '#eaeffe' : '#fff',
    cursor: 'pointer',
    fontFamily: 'sans-serif',
    fontSize: 14,
    color: selected ? '#2d5be3' : '#1a1a1f',
    textAlign: 'left' as const,
    fontWeight: selected ? 500 : 400,
  }
}

const nextBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px',
  background: '#2d5be3',
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
  const [step,      setStep]      = useState<1|2|3>(1)
  const [q1,        setQ1]        = useState('')
  const [q2,        setQ2]        = useState('')
  const [q3,        setQ3]        = useState('')
  const [loading,   setLoading]   = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error,     setError]     = useState('')

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  // ── FINISH — save profile + load demo resume + redirect ───────────────────
  async function finish(finalQ3: string) {
    setQ3(finalQ3)
    setLoading(true)
    setError('')

    const field = q2 || 'marketing'
    const demo  = getDemoResume(field)

    try {
      setLoadingMsg('Saving your preferences…')

      // 1. Save career info to profile
      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career_field: field,
          career_stage: q1 || 'recent',
          priority:     finalQ3,
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
      router.push('/?welcome=1')

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false); setLoadingMsg('')
    }
  }

  // ── LOADING SCREEN ────────────────────────────────────────────────────────
  if (loading) {
    const field = q2 || 'marketing'
    const demo  = getDemoResume(field)
    return (
      <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1a1a1f', marginBottom: 8 }}>
              Setting up your dashboard<span style={{ color: '#2d5be3' }}>.</span>
            </div>
            <p style={{ fontSize: 13.5, color: '#7a7a85', lineHeight: 1.7, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
              We're loading a demo resume so your feed looks alive from day one. You can replace it with your real resume at any time.
            </p>
            <div style={{ background: '#f4f2ed', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 10.5, color: '#b0b0b8', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Your demo resume</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#2d5be3', marginBottom: 2 }}>{demo.name}</div>
              <div style={{ fontSize: 13, color: '#7a7a85' }}>{demo.title} · {demo.school}, {demo.gradYear}</div>
            </div>
            <div style={{ fontSize: 13, color: '#b8a99a', marginBottom: 16 }}>{loadingMsg}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#2d5be3', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
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
  const currentQ = step === 1 ? Q1 : step === 2 ? Q2 : Q3
  const currentVal = step === 1 ? q1 : step === 2 ? q2 : q3

  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: 'sans-serif' }}>

      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1a1a1f', letterSpacing: '-.02em' }}>
          fitted<span style={{ color: '#2d5be3' }}>.</span>
        </div>
        <div style={{ fontSize: 12.5, color: '#b8a99a', fontWeight: 300, marginTop: 4 }}>
          get a career tailor-made for you
        </div>
      </div>

      <div style={cardStyle}>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#b0b0b8' }}>Question {step} of 3</span>
            <span style={{ fontSize: 12, color: '#b0b0b8' }}>{progress}%</span>
          </div>
          <div style={{ height: 4, background: '#e8e4db', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#2d5be3', borderRadius: 20, transition: 'width .3s ease' }} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: step === 2 ? 380 : 'none', overflowY: step === 2 ? 'auto' : 'visible', paddingRight: step === 2 ? 4 : 0 }}>
          {currentQ.options.map(opt => (
            <button key={opt.id}
              onClick={() => {
                if (step === 1) { setQ1(opt.id) }
                if (step === 2) { setQ2(opt.id) }
                if (step === 3) { finish(opt.id) }
              }}
              style={optBtn(currentVal === opt.id)}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.emoji}</span>
              <span style={{ flex: 1 }}>{opt.label}</span>
              {currentVal === opt.id && <span style={{ color: '#2d5be3', fontSize: 16, flexShrink: 0 }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <p style={{ fontSize: 13, color: '#e85d3a', marginBottom: 12 }}>{error}</p>}

        {/* Next button — Q1 and Q2 only (Q3 auto-advances on selection) */}
        {step < 3 && (
          <button
            onClick={() => setStep(prev => (prev + 1) as 1|2|3)}
            disabled={!currentVal}
            style={{ ...nextBtnStyle, opacity: currentVal ? 1 : .4, cursor: currentVal ? 'pointer' : 'not-allowed' }}>
            Next →
          </button>
        )}

        {/* Navigation row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
          {step > 1 && (
            <button onClick={() => setStep(prev => (prev - 1) as 1|2|3)} style={{ ...skipStyle, width: 'auto', color: '#7a7a85' }}>
              ← Back
            </button>
          )}
          <button
            onClick={() => {
              // Skip with defaults
              if (step === 1) { if (!q1) setQ1('recent'); setStep(2) }
              else if (step === 2) { if (!q2) setQ2('marketing'); setStep(3) }
              else { finish('exploring') }
            }}
            style={{ ...skipStyle, width: 'auto' }}>
            {step === 3 ? 'Skip — take me to my dashboard' : 'Skip'}
          </button>
        </div>
      </div>

      {/* Already have a real resume? */}
      <p style={{ marginTop: 20, fontSize: 12.5, color: '#b0b0b8', textAlign: 'center' }}>
        Already have a real resume?{' '}
        <a href="/" style={{ color: '#2d5be3', textDecoration: 'none' }}>
          Skip the quiz and go straight to your dashboard →
        </a>
      </p>
    </div>
  )
}
