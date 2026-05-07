'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Resume { id: string; name: string; is_active: boolean }
interface Blindspot { issue: string; severity: 'high' | 'medium'; fix: string }
interface Dimension { label: string; score: number; note: string }

interface HealthResult {
  score:      number
  grade:      string
  summary:    string
  strengths:  string[]
  blindspots: Blindspot[]
  dimensions: Dimension[]
  quickWins:  string[]
  resumeName: string
  isPro:      boolean
}

function mc(n: number) {
  if (n >= 75) return '#1a7a4a'
  if (n >= 60) return '#2d5be3'
  if (n >= 45) return '#b8750a'
  return '#a32d2d'
}

function ScoreRing({ value, size = 96 }: { value: number; size?: number }) {
  const r = size * 0.38; const circ = 2 * Math.PI * r; const dash = (value / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={size * 0.072} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={mc(value)} strokeWidth={size * 0.072}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.21, fontWeight: 700, color: mc(value), letterSpacing: -1 }}>{value}</div>
    </div>
  )
}

const LOADING_MSGS = [
  'Reading your resume…',
  'Checking impact signals…',
  'Evaluating career narrative…',
  'Scanning language and verbs…',
  'Assessing positioning…',
  'Drafting candid insights…',
]

export default function ResumeHealthPage() {
  const router  = useRouter()
  const params  = useSearchParams()
  const preId   = params.get('r') || ''

  const [resumes,    setResumes]    = useState<Resume[]>([])
  const [resumeId,   setResumeId]   = useState(preId)
  const [step,       setStep]       = useState<'setup'|'loading'|'results'>('setup')
  const [result,     setResult]     = useState<HealthResult | null>(null)
  const [error,      setError]      = useState('')
  const [loadMsg,    setLoadMsg]    = useState(LOADING_MSGS[0])
  const [copied,     setCopied]     = useState<number | null>(null)
  const loadIdx   = useRef(0)
  const loadTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/resumes').then(r => r.json()).then(d => {
      if (!d?.resumes?.length) return
      setResumes(d.resumes)
      if (!preId) {
        const active = d.resumes.find((r: Resume) => r.is_active) ?? d.resumes[0]
        setResumeId(active.id)
      }
    })
  }, [preId])

  function startMsgs() {
    loadIdx.current = 0; setLoadMsg(LOADING_MSGS[0])
    loadTimer.current = setInterval(() => {
      loadIdx.current = (loadIdx.current + 1) % LOADING_MSGS.length
      setLoadMsg(LOADING_MSGS[loadIdx.current])
    }, 1600)
  }
  function stopMsgs() { if (loadTimer.current) clearInterval(loadTimer.current) }

  async function runAnalysis() {
    if (!resumeId) return
    setStep('loading'); setError(''); startMsgs()
    const res = await fetch('/api/resume-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId }),
    })
    stopMsgs()
    const data = await res.json()
    if (!res.ok || data.error) { setError(data.error || 'Something went wrong.'); setStep('setup'); return }
    setResult(data); setStep('results')
    fetch('/api/coach', {method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({event:'health_checked', data:{score: data.score, grade: data.grade, resumeName: data.resumeName}})}).catch(()=>{})
  }

  function copyWin(text: string, i: number) {
    navigator.clipboard?.writeText(text); setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  const gradeColor = (g: string) => {
    if (g.startsWith('A')) return '#1a7a4a'
    if (g.startsWith('B')) return '#2d5be3'
    if (g.startsWith('C')) return '#b8750a'
    return '#a32d2d'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', fontFamily: 'sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media (max-width: 768px) {
          .rh-page{padding:16px 16px 60px !important}
          .rh-score-card{flex-direction:column !important;align-items:flex-start !important;gap:14px !important;padding:18px 16px !important}
        }
      `}</style>

      <nav style={{ height: 56, background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#7a7a85', cursor: 'pointer', fontSize: 13, fontFamily: 'sans-serif', padding: 0 }}>← Back</button>
        <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,.1)' }} />
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1a1a1f', letterSpacing: '-.02em' }}>fitted<span style={{ color: '#2d5be3' }}>.</span></span>
        <span style={{ fontSize: 13, color: '#b0b0b8' }}>/ Resume Health</span>
      </nav>

      <div className="rh-page" style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* ── STEP 1: SETUP ────────────────────────────── */}
        {step === 'setup' && (
          <div style={{ animation: 'fadeIn .3s ease' }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1a1a1f', fontWeight: 400, margin: '0 0 6px' }}>Resume health check</h1>
              <p style={{ fontSize: 13.5, color: '#7a7a85', margin: 0, lineHeight: 1.6 }}>
                An honest, mentor-style evaluation of your resume — no job description needed. fitted. reads it the way a hiring manager would.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
                Select resume to evaluate
              </label>
              {resumes.length === 0
                ? <p style={{ fontSize: 13, color: '#b0b0b8', fontStyle: 'italic', margin: 0 }}>
                    No resumes uploaded yet.{' '}
                    <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 13, padding: 0, textDecoration: 'underline' }}>Upload one first →</button>
                  </p>
                : <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                    {resumes.map(r => (
                      <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `1px solid ${resumeId === r.id ? '#2d5be3' : 'rgba(0,0,0,.08)'}`, background: resumeId === r.id ? '#eaeffe' : '#f4f2ed', cursor: 'pointer' }}>
                        <input type="radio" name="resume" value={r.id} checked={resumeId === r.id} onChange={() => setResumeId(r.id)} style={{ accentColor: '#2d5be3' }} />
                        <span style={{ fontSize: 13.5, color: resumeId === r.id ? '#2d5be3' : '#3d3d45', fontWeight: resumeId === r.id ? 500 : 400 }}>{r.name}</span>
                        {r.is_active && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#1a7a4a', background: '#e6f5ed', padding: '2px 7px', borderRadius: 20 }}>Active</span>}
                      </label>
                    ))}
                  </div>
              }
            </div>

            {error && <p style={{ fontSize: 13, color: '#a32d2d', background: '#fdecea', border: '1px solid rgba(192,57,43,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>{error}</p>}

            <button onClick={runAnalysis} disabled={!resumeId}
              style={{ width: '100%', padding: '13px 20px', background: resumeId ? '#2f3e5c' : '#d0cfc8', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: resumeId ? 'pointer' : 'not-allowed', fontFamily: 'sans-serif', transition: 'background .15s' }}>
              Analyze resume →
            </button>
            <p style={{ textAlign: 'center' as const, fontSize: 11.5, color: '#b0b0b8', marginTop: 10 }}>Uses AI · ~10 seconds · 5 health checks per hour</p>
          </div>
        )}

        {/* ── STEP 2: LOADING ──────────────────────────── */}
        {step === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 18, animation: 'fadeIn .3s ease' }}>
            <div style={{ width: 40, height: 40, border: '3.5px solid #eaeffe', borderTop: '3.5px solid #2d5be3', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1a1a1f', marginBottom: 6 }}>Reading your resume</div>
              <div style={{ fontSize: 13, color: '#7a7a85', minHeight: 20 }}>{loadMsg}</div>
            </div>
            <div style={{ fontSize: 11.5, color: '#b0b0b8', background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 8, padding: '6px 14px' }}>Honest feedback takes a moment</div>
          </div>
        )}

        {/* ── STEP 3: RESULTS ──────────────────────────── */}
        {step === 'results' && result && (
          <div style={{ animation: 'fadeIn .4s ease' }}>

            {/* Score card */}
            <div className="rh-score-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 14, padding: '24px 28px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 24 }}>
              <ScoreRing value={result.score} size={96} />
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 38, color: gradeColor(result.grade), fontWeight: 400, lineHeight: 1 }}>{result.grade}</span>
                  <span style={{ fontSize: 13, color: '#b0b0b8' }}>out of 100</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#3d3d45', marginBottom: 2 }}>{result.resumeName}</div>
                <div style={{ fontSize: 12, color: '#7a7a85' }}>
                  {result.score >= 80 ? 'Strong — competitive in most applicant pools'
                    : result.score >= 65 ? 'Solid foundation with targeted gaps to close'
                    : result.score >= 50 ? 'Average — needs work to stand out competitively'
                    : 'Needs significant revision before active applications'}
                </div>
              </div>
            </div>

            {/* fitted. thinks */}
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #2f3e5c', borderRadius: '0 12px 12px 0', padding: '16px 20px', marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>✦ fitted. thinks</div>
              <p style={{ fontSize: 13.5, color: '#3d3d45', lineHeight: 1.8, margin: 0 }}>{result.summary}</p>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 12, padding: '16px 20px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1a7a4a', letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>What's working</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {result.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#1a7a4a', fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                      <p style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.6, margin: 0 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blind spots */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1a1a1f', fontWeight: 400, margin: 0 }}>What's holding you back</h2>
                {!result.isPro && <span style={{ fontSize: 11, color: '#b8750a', background: '#fdf3e3', padding: '3px 9px', borderRadius: 20 }}>✦ Full list with Pro</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {(result.isPro ? result.blindspots : result.blindspots.slice(0, 1)).map((b, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: `3px solid ${b.severity === 'high' ? '#a32d2d' : '#b8750a'}`, borderRadius: '0 10px 10px 0', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: b.severity === 'high' ? '#fdecea' : '#fdf3e3', color: b.severity === 'high' ? '#a32d2d' : '#854f0b', textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{b.severity}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.6, margin: '0 0 10px' }}>{b.issue}</p>
                    <div style={{ background: '#f4f2ed', borderRadius: 7, padding: '8px 12px', fontSize: 12.5, color: '#1a1a1f', lineHeight: 1.6 }}>
                      <strong style={{ color: '#2d5be3' }}>Fix: </strong>{b.fix}
                    </div>
                  </div>
                ))}
                {!result.isPro && result.blindspots.length > 1 && (
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ filter: 'blur(5px)', opacity: .45, pointerEvents: 'none' }}>
                      {result.blindspots.slice(1, 3).map((b, i) => (
                        <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: `3px solid ${b.severity === 'high' ? '#a32d2d' : '#b8750a'}`, borderRadius: '0 10px 10px 0', padding: '14px 16px', marginBottom: 10 }}>
                          <p style={{ fontSize: 13, color: '#3d3d45', margin: '0 0 8px' }}>{b.issue}</p>
                          <div style={{ background: '#f4f2ed', borderRadius: 7, padding: '8px 12px', fontSize: 12.5, color: '#1a1a1f' }}>{b.fix}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(244,242,237,.85)' }}>
                      <div style={{ fontSize: 18, color: '#b8750a' }}>✦</div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#1a1a1f' }}>{result.blindspots.length - 1} more blind spots</div>
                      <button onClick={() => router.push('/?upgrade=1')} style={{ background: '#b8750a', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>Unlock with Pro</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dimensions — Pro only */}
            {result.isPro && result.dimensions.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 12, padding: '16px 20px', marginBottom: 18 }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1a1a1f', fontWeight: 400, margin: '0 0 16px' }}>Dimension breakdown</h2>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  {result.dimensions.map(d => (
                    <div key={d.label}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: '#3d3d45', fontWeight: 500 }}>{d.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: mc(d.score) }}>{d.score}%</span>
                      </div>
                      <div style={{ height: 5, background: '#f0ede7', borderRadius: 20, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ width: `${d.score}%`, height: '100%', background: mc(d.score), borderRadius: 20, transition: 'width .6s ease' }} />
                      </div>
                      <p style={{ fontSize: 11.5, color: '#7a7a85', margin: 0, lineHeight: 1.5 }}>{d.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dimensions teaser — free */}
            {!result.isPro && (
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 12, padding: '16px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
                <div style={{ filter: 'blur(4px)', opacity: .4, pointerEvents: 'none' }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1a1a1f', fontWeight: 400, margin: '0 0 16px' }}>Dimension breakdown</h2>
                  {['Impact & Results', 'Clarity & Scannability', 'Language & Verbs'].map(l => (
                    <div key={l} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 13 }}>{l}</span><span style={{ fontSize: 12 }}>—%</span></div>
                      <div style={{ height: 5, background: '#e0ddd6', borderRadius: 20 }} />
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(244,242,237,.88)' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#1a1a1f' }}>5-dimension breakdown</div>
                  <div style={{ fontSize: 12, color: '#7a7a85', maxWidth: 220, textAlign: 'center' as const, lineHeight: 1.5 }}>See exactly where your resume scores on impact, clarity, language, narrative, and positioning.</div>
                  <button onClick={() => router.push('/?upgrade=1')} style={{ background: '#b8750a', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', marginTop: 4 }}>✦ Unlock with Pro</button>
                </div>
              </div>
            )}

            {/* Quick wins */}
            {result.quickWins.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1a1a1f', fontWeight: 400, margin: '0 0 14px' }}>
                  Quick wins
                  <span style={{ fontSize: 12, color: '#7a7a85', fontFamily: 'sans-serif', fontWeight: 400, marginLeft: 10 }}>Changes you could make today</span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {(result.isPro ? result.quickWins : result.quickWins.slice(0, 2)).map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#f4f2ed', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, color: '#b0b0b8', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      <p style={{ flex: 1, fontSize: 13, color: '#3d3d45', lineHeight: 1.6, margin: 0 }}>{w}</p>
                      <button onClick={() => copyWin(w, i)}
                        style={{ flexShrink: 0, background: copied === i ? '#e6f5ed' : '#fff', color: copied === i ? '#1a7a4a' : '#7a7a85', border: `1px solid ${copied === i ? 'rgba(26,122,74,.2)' : 'rgba(0,0,0,.1)'}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'sans-serif', transition: 'all .15s' }}>
                        {copied === i ? '✓' : 'Copy'}
                      </button>
                    </div>
                  ))}
                  {!result.isPro && result.quickWins.length > 2 && (
                    <div style={{ padding: '8px 12px', background: '#fdf3e3', borderRadius: 8, fontSize: 12, color: '#854f0b', textAlign: 'center' as const }}>
                      ✦ {result.quickWins.length - 2} more quick wins with Pro
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setStep('setup'); setResult(null); setError('') }}
                style={{ flex: 1, padding: '11px 16px', background: 'none', color: '#7a7a85', border: '1px solid rgba(0,0,0,.12)', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                ← Check another resume
              </button>
              <button onClick={() => router.push('/optimize')}
                style={{ flex: 1, padding: '11px 16px', background: '#2f3e5c', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                Optimize for a role →
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
