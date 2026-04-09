'use client'
// fitted. — Quiz Page
// Light 3-question onboarding quiz.
// Routes to one of 10 demo resumes based on field (Q2).
// Loads the demo resume into Supabase, then redirects to dashboard.
// Q3 (priority) is saved to profile to influence job sort order.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDemoResume } from '../../lib/demo-resumes'

// ─── QUIZ DATA ────────────────────────────────────────────────────────────────

const Q1_OPTIONS = [
  { id: 'college',    emoji: '🎓', label: 'Still in college' },
  { id: 'recent',     emoji: '📄', label: 'Recent grad (last 2 years)' },
  { id: 'working',    emoji: '💼', label: 'Already working, looking for something better' },
  { id: 'changing',   emoji: '🔄', label: 'Changing careers or industries' },
  { id: 'returning',  emoji: '⏸️', label: 'Returning to work after a break' },
]

const Q2_OPTIONS = [
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
]

const Q3_OPTIONS = [
  { id: 'pay',       emoji: '💸', label: 'Finding something that pays well' },
  { id: 'remote',    emoji: '🏠', label: 'Working remotely or having flexibility' },
  { id: 'growth',    emoji: '📈', label: 'Growing fast in my career' },
  { id: 'change',    emoji: '🔀', label: 'Making a career change' },
  { id: 'exploring', emoji: '🗺️', label: 'Just figuring out what\'s out there' },
]

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const router = useRouter()
  const [step,      setStep]      = useState(1)  // 1 | 2 | 3 | 'loading' | 'done'
  const [q1,        setQ1]        = useState('')
  const [q2,        setQ2]        = useState('')
  const [q3,        setQ3]        = useState('')
  const [error,     setError]     = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Progress bar width
  const progress = step === 1 ? 33 : step === 2 ? 66 : step === 3 ? 100 : 100

  // ── SUBMIT — load demo resume + save profile, then redirect ────────────────
  async function handleFinish(finalQ3: string) {
    setIsLoading(true); setError('')
    try {
      const demo = getDemoResume(q2)

      // 1. Upload the demo resume text via the resume route
      const uploadRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        `${demo.name} (Demo)`,
          filename:    `${demo.id}.txt`,
          resume_text: demo.resumeText,
        }),
      })
      if (!uploadRes.ok) throw new Error('Could not load demo resume.')

      // 2. Save career field + priority to profile
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career_field: q2,
          career_stage: q1,
          priority:     finalQ3,
        }),
      })

      // 3. Go to dashboard — quiz is done
      router.push('/?welcome=1')

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  function selectQ3AndFinish(val: string) {
    setQ3(val)
    handleFinish(val)
  }

  // ── SHARED STYLES ──────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    padding: '32px 28px',
    maxWidth: 560,
    width: '100%',
    border: '1px solid rgba(0,0,0,.07)',
  }
  const optionBtn = (selected: boolean): React.CSSProperties => ({
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
    transition: 'all .15s',
    fontWeight: selected ? 500 : 400,
  })
  const nextBtn: React.CSSProperties = {
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
  const skipBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#b0b0b8',
    fontFamily: 'sans-serif',
    fontSize: 13,
    cursor: 'pointer',
    marginTop: 12,
    textAlign: 'center' as const,
    width: '100%',
  }

  // ── LOADING STATE ──────────────────────────────────────────────────────────
  if (isLoading) {
    const demo = getDemoResume(q2)
    return (
      <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1a1a1f', marginBottom: 6 }}>
              Setting up your dashboard<span style={{ color: '#2d5be3' }}>.</span>
            </div>
            <p style={{ fontSize: 14, color: '#7a7a85', lineHeight: 1.7, marginBottom: 24 }}>
              We're loading a demo resume based on your answers so your feed looks alive from day one. You can replace it with your real resume at any time.
            </p>
            <div style={{ background: '#f4f2ed', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: '#b0b0b8', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>Loading demo resume</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#2d5be3' }}>{demo.name}</div>
              <div style={{ fontSize: 13, color: '#7a7a85' }}>{demo.title} · {demo.school}, {demo.gradYear}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#2d5be3', opacity: .3, animation: `pulse 1.2s ease-in-out ${i * .2}s infinite` }} />
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: .3; transform: scale(1); }
            50%       { opacity: 1;  transform: scale(1.2); }
          }
        `}</style>
      </div>
    )
  }

  // ── MAIN QUIZ LAYOUT ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>

      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1a1a1f', letterSpacing: '-.02em' }}>
          fitted<span style={{ color: '#2d5be3' }}>.</span>
        </div>
        <div style={{ fontSize: 12.5, color: '#b8a99a', fontWeight: 300, marginTop: 3 }}>get a career tailor-made for you</div>
      </div>

      <div style={card}>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#b0b0b8' }}>Question {Math.min(step as number, 3)} of 3</span>
            <span style={{ fontSize: 12, color: '#b0b0b8' }}>{progress}%</span>
          </div>
          <div style={{ height: 4, background: '#e8e4db', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#2d5be3', borderRadius: 20, transition: 'width .3s ease' }} />
          </div>
        </div>

        {/* ── QUESTION 1 ── */}
        {step === 1 && (
          <>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1a1a1f', margin: '0 0 6px', fontWeight: 400 }}>
              Where are you right now?
            </h2>
            <p style={{ fontSize: 13.5, color: '#7a7a85', margin: '0 0 20px', lineHeight: 1.6 }}>
              This helps us show you the most relevant roles and resources.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {Q1_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setQ1(opt.id)} style={optionBtn(q1 === opt.id)}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.emoji}</span>
                  <span>{opt.label}</span>
                  {q1 === opt.id && <span style={{ marginLeft: 'auto', color: '#2d5be3', fontSize: 16 }}>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => { if (q1) setStep(2) }} disabled={!q1}
              style={{ ...nextBtn, opacity: q1 ? 1 : .4, cursor: q1 ? 'pointer' : 'not-allowed' }}>
              Next →
            </button>
            <button onClick={() => { setQ1('college'); setStep(2) }} style={skipBtn}>Skip this question</button>
          </>
        )}

        {/* ── QUESTION 2 ── */}
        {step === 2 && (
          <>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1a1a1f', margin: '0 0 6px', fontWeight: 400 }}>
              What field are you heading into?
            </h2>
            <p style={{ fontSize: 13.5, color: '#7a7a85', margin: '0 0 20px', lineHeight: 1.6 }}>
              We'll load a demo resume in this area so your feed looks relevant right away.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
              {Q2_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setQ2(opt.id)} style={optionBtn(q2 === opt.id)}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.emoji}</span>
                  <span>{opt.label}</span>
                  {q2 === opt.id && <span style={{ marginLeft: 'auto', color: '#2d5be3', fontSize: 16 }}>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => { if (q2) setStep(3) }} disabled={!q2}
              style={{ ...nextBtn, opacity: q2 ? 1 : .4, cursor: q2 ? 'pointer' : 'not-allowed' }}>
              Next →
            </button>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center' }}>
              <button onClick={() => setStep(1)} style={{ ...skipBtn, width: 'auto', color: '#7a7a85' }}>← Back</button>
              <button onClick={() => { setQ2('marketing'); setStep(3) }} style={{ ...skipBtn, width: 'auto' }}>Skip</button>
            </div>
          </>
        )}

        {/* ── QUESTION 3 ── */}
        {step === 3 && (
          <>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1a1a1f', margin: '0 0 6px', fontWeight: 400 }}>
              What matters most to you right now?
            </h2>
            <p style={{ fontSize: 13.5, color: '#7a7a85', margin: '0 0 20px', lineHeight: 1.6 }}>
              We'll use this to sort your job feed and personalize your experience.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {Q3_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => selectQ3AndFinish(opt.id)} style={optionBtn(q3 === opt.id)}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {error && <p style={{ fontSize: 13, color: '#e85d3a', marginTop: 8 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center' }}>
              <button onClick={() => setStep(2)} style={{ ...skipBtn, width: 'auto', color: '#7a7a85' }}>← Back</button>
              <button onClick={() => selectQ3AndFinish('exploring')} style={{ ...skipBtn, width: 'auto' }}>Skip — take me to my dashboard</button>
            </div>
          </>
        )}

      </div>

      {/* Already have an account note */}
      <p style={{ marginTop: 20, fontSize: 12.5, color: '#b0b0b8', textAlign: 'center' }}>
        Already have a real resume?{' '}
        <a href="/" style={{ color: '#2d5be3', textDecoration: 'none' }}>Skip the quiz and go straight to your dashboard →</a>
      </p>
    </div>
  )
}
