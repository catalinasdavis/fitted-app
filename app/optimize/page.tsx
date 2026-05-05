'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Resume { id: string; name: string; is_active: boolean }

interface Suggestion {
  section:  string
  type:     'bullet_rewrite' | 'keyword_add' | 'reorder' | 'tone_shift'
  impact:   'high' | 'medium' | 'low'
  before:   string
  after:    string
  why:      string
}

interface OptimizeResult {
  scoreBefore:      number
  scoreAfter:       number
  summary:          string
  suggestions:      Suggestion[]
  keywordsFound:    string[]
  keywordsMissing:  string[]
  resumeName:       string
  isPro:            boolean
}

function mc(n: number) {
  if (n >= 74) return '#1a7a4a'
  if (n >= 62) return '#2d5be3'
  if (n >= 50) return '#b8750a'
  return '#7a7a85'
}

function ScoreRing({ value, size = 72 }: { value: number; size?: number }) {
  const r = size * 0.38; const circ = 2 * Math.PI * r; const dash = (value / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={size*0.07} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={mc(value)} strokeWidth={size*0.07}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.22, fontWeight: 700, color: mc(value), letterSpacing: -0.5 }}>{value}%</div>
    </div>
  )
}

const IMPACT_META: Record<string, [string, string]> = {
  high:   ['#fdecea', '#a32d2d'],
  medium: ['#fdf3e3', '#854f0b'],
  low:    ['#f4f2ed', '#7a7a85'],
}

const TYPE_LABEL: Record<string, string> = {
  bullet_rewrite: 'Bullet rewrite',
  keyword_add:    'Keyword addition',
  reorder:        'Reorder',
  tone_shift:     'Tone shift',
}

const LOADING_MSGS = [
  'Reading your resume…',
  'Analyzing the job description…',
  'Identifying keyword gaps…',
  'Drafting improved bullets…',
  'Calibrating match score…',
]

export default function OptimizePage() {
  const router       = useRouter()
  const params       = useSearchParams()
  const preJobTitle  = params.get('jobtitle') || ''

  const [resumes,    setResumes]    = useState<Resume[]>([])
  const [resumeId,   setResumeId]   = useState('')
  const [jdText,     setJdText]     = useState('')
  const [step,       setStep]       = useState<'setup'|'loading'|'results'>('setup')
  const [result,     setResult]     = useState<OptimizeResult | null>(null)
  const [error,      setError]      = useState('')
  const [loadMsg,    setLoadMsg]    = useState(LOADING_MSGS[0])
  const [copied,     setCopied]     = useState<number | null>(null)
  const loadIdx  = useRef(0)
  const loadTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/resumes').then(r => r.json()).then(d => {
      if (d?.resumes?.length) {
        setResumes(d.resumes)
        const active = d.resumes.find((r: Resume) => r.is_active) ?? d.resumes[0]
        setResumeId(active.id)
      }
    })
  }, [])

  function startLoadingMessages() {
    loadIdx.current = 0
    setLoadMsg(LOADING_MSGS[0])
    loadTimer.current = setInterval(() => {
      loadIdx.current = (loadIdx.current + 1) % LOADING_MSGS.length
      setLoadMsg(LOADING_MSGS[loadIdx.current])
    }, 1800)
  }

  function stopLoadingMessages() {
    if (loadTimer.current) clearInterval(loadTimer.current)
  }

  async function runOptimize() {
    if (!resumeId || jdText.trim().length < 50) return
    setStep('loading')
    setError('')
    startLoadingMessages()

    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId, jdText }),
    })
    stopLoadingMessages()

    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error || 'Something went wrong. Please try again.')
      setStep('setup')
      return
    }
    setResult(data)
    setStep('results')
  }

  function copyText(text: string, idx: number) {
    navigator.clipboard?.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  function reset() {
    setStep('setup')
    setResult(null)
    setError('')
    setJdText('')
  }

  const canAnalyze = resumeId && jdText.trim().length >= 50

  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', fontFamily: 'sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      {/* Nav */}
      <nav style={{ height: 56, background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>
        <button onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#7a7a85', cursor: 'pointer', fontSize: 13, fontFamily: 'sans-serif', padding: 0 }}>← Back</button>
        <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,.1)' }} />
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1a1a1f', letterSpacing: '-.02em' }}>
          fitted<span style={{ color: '#2d5be3' }}>.</span>
        </span>
        <span style={{ fontSize: 13, color: '#b0b0b8' }}>/ Resume Optimizer</span>
      </nav>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* ── STEP 1: SETUP ────────────────────────────────────── */}
        {step === 'setup' && (
          <div style={{ animation: 'fadeIn .3s ease' }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1a1a1f', fontWeight: 400, margin: '0 0 6px' }}>
                Optimize your resume
              </h1>
              <p style={{ fontSize: 13.5, color: '#7a7a85', margin: 0, lineHeight: 1.6 }}>
                {preJobTitle
                  ? `Tailoring for: ${preJobTitle}`
                  : 'Paste a job description and fitted. will rewrite your resume to match it — specifically, not generically.'}
              </p>
            </div>

            {/* Resume selector */}
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, padding: '18px 20px', marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
                Select resume
              </label>
              {resumes.length === 0
                ? <p style={{ fontSize: 13, color: '#b0b0b8', fontStyle: 'italic', margin: 0 }}>No resumes uploaded yet. <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 13, padding: 0, textDecoration: 'underline' }}>Upload one first →</button></p>
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

            {/* JD textarea */}
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
                Job description
              </label>
              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste the full job description here — responsibilities, requirements, nice-to-haves. The more complete, the better the optimization."
                style={{ width: '100%', minHeight: 220, padding: 12, border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 13, color: '#1a1a1f', background: '#f4f2ed', resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' as const }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: jdText.trim().length < 50 ? '#b8750a' : '#b0b0b8' }}>
                  {jdText.trim().length < 50 ? `${50 - jdText.trim().length} more characters needed` : `${jdText.trim().length} characters`}
                </span>
              </div>
            </div>

            {error && <p style={{ fontSize: 13, color: '#a32d2d', background: '#fdecea', border: '1px solid rgba(192,57,43,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>{error}</p>}

            <button onClick={runOptimize} disabled={!canAnalyze}
              style={{ width: '100%', padding: '13px 20px', background: canAnalyze ? '#2f3e5c' : '#d0cfc8', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: canAnalyze ? 'pointer' : 'not-allowed', fontFamily: 'sans-serif', transition: 'background .15s' }}>
              Analyze with fitted. AI →
            </button>
            <p style={{ textAlign: 'center' as const, fontSize: 11.5, color: '#b0b0b8', marginTop: 10 }}>
              Uses AI · Takes ~10–20 seconds · 5 optimizations per hour
            </p>
          </div>
        )}

        {/* ── STEP 2: LOADING ──────────────────────────────────── */}
        {step === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 18, animation: 'fadeIn .3s ease' }}>
            <div style={{ width: 40, height: 40, border: '3.5px solid #eaeffe', borderTop: '3.5px solid #2d5be3', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1a1a1f', marginBottom: 6 }}>fitted. is reading your resume</div>
              <div style={{ fontSize: 13, color: '#7a7a85', minHeight: 20, transition: 'opacity .3s' }}>{loadMsg}</div>
            </div>
            <div style={{ fontSize: 11.5, color: '#b0b0b8', background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 8, padding: '6px 14px' }}>
              This takes 10–20 seconds for the best results
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULTS ──────────────────────────────────── */}
        {step === 'results' && result && (
          <div style={{ animation: 'fadeIn .4s ease' }}>

            {/* Score header */}
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 14, padding: '20px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 }}>
                <ScoreRing value={result.scoreBefore} />
                <span style={{ fontSize: 10.5, color: '#b0b0b8', textTransform: 'uppercase' as const, letterSpacing: '.07em' }}>Before</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3 }}>
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
                  <path d="M1 8H26M26 8L20 2M26 8L20 14" stroke="#b0b0b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a7a4a' }}>+{result.scoreAfter - result.scoreBefore}pts</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 }}>
                <ScoreRing value={result.scoreAfter} />
                <span style={{ fontSize: 10.5, color: '#b0b0b8', textTransform: 'uppercase' as const, letterSpacing: '.07em' }}>After</span>
              </div>
              <div style={{ flex: 1, paddingLeft: 8, borderLeft: '1px solid rgba(0,0,0,.07)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Resume optimized</div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: '#1a1a1f', marginBottom: 2 }}>{result.resumeName}</div>
                <div style={{ fontSize: 12, color: '#7a7a85' }}>{result.suggestions.length} improvements · {result.keywordsMissing.length} keywords to add</div>
              </div>
            </div>

            {/* fitted. thinks summary */}
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderLeft: '3px solid #2f3e5c', borderRadius: '0 12px 12px 0', padding: '16px 20px', marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>✦ fitted. thinks</div>
              <p style={{ fontSize: 13.5, color: '#3d3d45', lineHeight: 1.75, margin: 0 }}>{result.summary}</p>
            </div>

            {/* Suggestions */}
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1a1a1f', fontWeight: 400, margin: '0 0 12px' }}>
                Suggested improvements
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 12, overflow: 'hidden' }}>
                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderBottom: '1px solid rgba(0,0,0,.06)', background: '#fafaf8' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: IMPACT_META[s.impact][0], color: IMPACT_META[s.impact][1], textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{s.impact}</span>
                      <span style={{ fontSize: 12, color: '#3d3d45', fontWeight: 500 }}>{s.section}</span>
                      <span style={{ fontSize: 10.5, color: '#b0b0b8', marginLeft: 'auto' }}>{TYPE_LABEL[s.type] || s.type}</span>
                    </div>
                    {/* Before */}
                    <div style={{ padding: '12px 16px 0' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b0b8', letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: 5 }}>Before</div>
                      <div style={{ background: '#f4f2ed', border: '1px solid rgba(0,0,0,.07)', borderRadius: 7, padding: '10px 12px', fontSize: 13, color: '#7a7a85', lineHeight: 1.6, fontStyle: s.before.startsWith('Missing') ? 'italic' : 'normal' as const }}>
                        {s.before}
                      </div>
                    </div>
                    {/* After */}
                    <div style={{ padding: '10px 16px 0' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#1a7a4a', letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: 5 }}>After</div>
                      <div style={{ background: '#f0fbf4', border: '1px solid rgba(26,122,74,.15)', borderLeft: '3px solid #1a7a4a', borderRadius: '0 7px 7px 0', padding: '10px 12px', fontSize: 13, color: '#1a1a1f', lineHeight: 1.6 }}>
                        {s.after}
                      </div>
                    </div>
                    {/* Why + copy */}
                    <div style={{ padding: '10px 16px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <p style={{ flex: 1, fontSize: 12, color: '#7a7a85', lineHeight: 1.6, margin: 0 }}>{s.why}</p>
                      <button onClick={() => copyText(s.after, i)}
                        style={{ flexShrink: 0, background: copied === i ? '#e6f5ed' : '#f4f2ed', color: copied === i ? '#1a7a4a' : '#3d3d45', border: `1px solid ${copied === i ? 'rgba(26,122,74,.2)' : 'rgba(0,0,0,.1)'}`, borderRadius: 7, padding: '6px 12px', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'sans-serif', whiteSpace: 'nowrap' as const, transition: 'all .15s' }}>
                        {copied === i ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro gate — shown to free users */}
            {!result.isPro && (
              <div style={{ background: '#fff', border: '1px solid rgba(184,117,10,.2)', borderRadius: 12, padding: '18px 20px', marginBottom: 18, textAlign: 'center' as const }}>
                <div style={{ fontSize: 20, color: '#b8750a', marginBottom: 6 }}>✦</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1a1a1f', fontWeight: 400, margin: '0 0 6px' }}>Get 5 optimizations with Pro</h3>
                <p style={{ fontSize: 13, color: '#7a7a85', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 14px' }}>
                  Pro members get 5 targeted suggestions per analysis — including reordering advice, tone shifts, and a complete keyword gap report.
                </p>
                <button onClick={() => router.push('/?upgrade=1')}
                  style={{ background: '#b8750a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                  Upgrade to Pro →
                </button>
              </div>
            )}

            {/* Keywords */}
            {(result.keywordsFound.length > 0 || result.keywordsMissing.length > 0) && (
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 12, padding: '16px 20px', marginBottom: 18 }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1a1a1f', fontWeight: 400, margin: '0 0 14px' }}>Keyword analysis</h2>
                {result.keywordsFound.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: '#1a7a4a', letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: 7 }}>✓ Already in your resume</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                      {result.keywordsFound.map(k => <span key={k} style={{ background: '#e6f5ed', color: '#1a7a4a', fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>{k}</span>)}
                    </div>
                  </div>
                )}
                {result.keywordsMissing.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: '#a32d2d', letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: 7 }}>✗ Add these to improve ATS score</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                      {result.keywordsMissing.map(k => <span key={k} style={{ background: '#fdecea', color: '#a32d2d', fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>{k}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reset}
                style={{ flex: 1, padding: '11px 16px', background: 'none', color: '#7a7a85', border: '1px solid rgba(0,0,0,.12)', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                ← Optimize another role
              </button>
              <button onClick={() => router.push('/')}
                style={{ flex: 1, padding: '11px 16px', background: '#2f3e5c', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                Back to jobs →
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
