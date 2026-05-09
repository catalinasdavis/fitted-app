'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'

interface Role {
  title:       string
  tag:         'Natural Next Step' | 'Good Transition Path' | 'Realistic Stretch'
  matchScore:  number
  why:         string
  skillGaps:   string[]
  salaryRange: string
  searchQuery: string
}

interface ExploreResult {
  summary: string
  roles:   Role[]
  isPro:   boolean
}

interface Profile {
  career_field: string | null
  career_stage: string | null
  about_me:     string | null
  pay_target:   string | null
}

function tagStyle(tag: Role['tag']): { bg: string; color: string } {
  if (tag === 'Natural Next Step')   return { bg: '#e6f5ed', color: '#1a7a4a' }
  if (tag === 'Good Transition Path') return { bg: '#eaeffe', color: '#2d5be3' }
  return { bg: '#fdf3e3', color: '#b8750a' }
}

function mc(n: number) {
  if (n >= 74) return '#1a7a4a'
  if (n >= 62) return '#2d5be3'
  return '#b8750a'
}

function ScoreRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = size * 0.38; const circ = 2 * Math.PI * r; const dash = (value / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={size * 0.08} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={mc(value)} strokeWidth={size * 0.08}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.22, fontWeight: 700, color: mc(value), letterSpacing: -0.5 }}>{value}</div>
    </div>
  )
}

const LOADING_MSGS = [
  'Mapping your background…',
  'Scanning career paths…',
  'Estimating fit for each role…',
  'Identifying skill gaps…',
  'Checking salary ranges…',
  'Drafting candid assessments…',
]

const FIELD_LABELS: Record<string, string> = {
  marketing:'Marketing & Comms', business:'Business & Sales', tech:'Technology',
  creative:'Creative & Design', healthcare:'Healthcare', legal:'Legal',
  engineering:'Engineering', finance:'Finance & Accounting', hr:'Human Resources',
  nonprofit:'Nonprofit & Education',
}

function ExploreInner() {
  const router = useRouter()

  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [query,     setQuery]     = useState('')
  const [step,      setStep]      = useState<'setup'|'loading'|'results'>('setup')
  const [result,    setResult]    = useState<ExploreResult | null>(null)
  const [error,     setError]     = useState('')
  const [loadMsg,   setLoadMsg]   = useState(LOADING_MSGS[0])
  const loadIdx   = useRef(0)
  const loadTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d?.profile) {
        const p: Profile = d.profile
        setProfile(p)
        if (!query) {
          const parts: string[] = []
          if (p.career_field) parts.push(`I work in ${FIELD_LABELS[p.career_field] ?? p.career_field}`)
          if (p.career_stage) parts.push(`at the ${p.career_stage} level`)
          if (p.about_me)     parts.push(p.about_me)
          if (parts.length)   setQuery(parts.join(', ') + '.')
        }
      }
    }).catch(() => {})
  // only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startMsgs() {
    loadIdx.current = 0; setLoadMsg(LOADING_MSGS[0])
    loadTimer.current = setInterval(() => {
      loadIdx.current = (loadIdx.current + 1) % LOADING_MSGS.length
      setLoadMsg(LOADING_MSGS[loadIdx.current])
    }, 1800)
  }
  function stopMsgs() { if (loadTimer.current) clearInterval(loadTimer.current) }

  async function runExplore() {
    if (query.trim().length < 10) { setError('Add a bit more about your background or what you want to explore.'); return }
    setStep('loading'); setError(''); startMsgs()
    const res = await fetch('/api/explore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
    })
    stopMsgs()
    const data = await res.json()
    if (!res.ok || data.error) { setError(data.error || 'Something went wrong.'); setStep('setup'); return }
    setResult(data); setStep('results')
  }

  function goSearch(searchQuery: string) {
    router.push(`/?q=${encodeURIComponent(searchQuery)}`)
  }

  const charLeft = 1200 - query.length

  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', fontFamily: 'sans-serif' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes pulse   { 0%,100% { opacity:.5 } 50% { opacity:1 } }
        .ex-card { animation: fadeIn .35s ease both }
        .ex-card:nth-child(2) { animation-delay: .07s }
        .ex-card:nth-child(3) { animation-delay: .14s }
        .ex-card:nth-child(4) { animation-delay: .21s }
        .ex-card:nth-child(5) { animation-delay: .28s }
        .ex-card:nth-child(6) { animation-delay: .35s }
        @media (max-width: 768px) {
          .ex-page  { padding: 16px 16px 72px !important }
          .ex-grid  { grid-template-columns: 1fr !important }
          .ex-card-inner { flex-direction: column !important; gap: 12px !important }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ height: 56, background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#7a7a85', cursor: 'pointer', fontSize: 13, fontFamily: 'sans-serif', padding: 0 }}>← Back</button>
        <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,.1)' }} />
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1a1a1f', letterSpacing: '-.02em' }}>fitted<span style={{ color: '#2d5be3' }}>.</span></span>
        <span style={{ fontSize: 13, color: '#b0b0b8' }}>/ Role Explorer</span>
      </nav>

      <div className="ex-page" style={{ maxWidth: 780, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Setup */}
        {step === 'setup' && (
          <div style={{ animation: 'fadeIn .3s ease' }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1a1a1f', letterSpacing: '-.02em', marginBottom: 8 }}>
                What could you do?
              </h1>
              <p style={{ fontSize: 14, color: '#7a7a85', lineHeight: 1.6, maxWidth: 520 }}>
                Describe your background, what you're good at, or what you want to do next.
                fitted. will map realistic career paths with honest fit scores.
              </p>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,.08)', padding: '20px 22px', marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7a7a85', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Your background &amp; goals
              </label>
              <textarea
                value={query}
                onChange={e => { setQuery(e.target.value); setError('') }}
                placeholder="e.g. I've spent 4 years in retail management and I'm good with people and operations, but I want to move into a more analytical role or something in tech. Open to anything realistic."
                rows={5}
                maxLength={1200}
                style={{ width: '100%', border: '1.5px solid rgba(0,0,0,.12)', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#1a1a1f', fontFamily: 'sans-serif', resize: 'vertical', lineHeight: 1.6, outline: 'none', background: '#fdfcfb', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 11.5, color: charLeft < 100 ? '#b8750a' : '#b0b0b8' }}>
                  {charLeft} characters left
                </span>
                {profile && (
                  <span style={{ fontSize: 11.5, color: '#b0b0b8' }}>
                    ✓ Profile data included automatically
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(163,45,45,.07)', border: '1px solid rgba(163,45,45,.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#a32d2d', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={runExplore}
              disabled={query.trim().length < 10}
              style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: query.trim().length < 10 ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif', opacity: query.trim().length < 10 ? .5 : 1, transition: 'opacity .15s' }}
            >
              ✦ Explore career paths
            </button>
          </div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 18 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(45,91,227,.15)', borderTop: '3px solid #2d5be3', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14, color: '#7a7a85', animation: 'pulse 2s ease infinite' }}>{loadMsg}</p>
          </div>
        )}

        {/* Results */}
        {step === 'results' && result && (
          <div style={{ animation: 'fadeIn .3s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1a1a1f', letterSpacing: '-.02em', marginBottom: 10 }}>
                  Career paths for you
                </h1>
                <p style={{ fontSize: 14, color: '#5a5a65', lineHeight: 1.65, maxWidth: 560, fontStyle: 'italic' }}>
                  "{result.summary}"
                </p>
              </div>
              <button
                onClick={() => { setStep('setup'); setResult(null); setError('') }}
                style={{ background: 'none', border: '1px solid rgba(0,0,0,.12)', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, color: '#7a7a85', cursor: 'pointer', fontFamily: 'sans-serif', flexShrink: 0 }}
              >
                ← Try again
              </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {(['Natural Next Step', 'Good Transition Path', 'Realistic Stretch'] as const).map(tag => {
                const s = tagStyle(tag)
                return (
                  <span key={tag} style={{ fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px' }}>
                    {tag}
                  </span>
                )
              })}
            </div>

            {/* Role cards */}
            <div className="ex-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {result.roles.map((role, i) => {
                const ts = tagStyle(role.tag)
                return (
                  <div key={i} className="ex-card" style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,.08)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Card header */}
                    <div className="ex-card-inner" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <ScoreRing value={role.matchScore} size={52} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', background: ts.bg, color: ts.color, borderRadius: 20, padding: '2px 9px', marginBottom: 6 }}>
                          {role.tag}
                        </span>
                        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1a1a1f', letterSpacing: '-.01em', lineHeight: 1.3, margin: 0 }}>
                          {role.title}
                        </h2>
                        <div style={{ fontSize: 12.5, color: '#7a7a85', marginTop: 4, fontWeight: 500 }}>
                          {role.salaryRange}
                        </div>
                      </div>
                    </div>

                    {/* Why */}
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#b0b0b8', marginBottom: 5 }}>Why it fits</div>
                      <p style={{ fontSize: 13, color: '#3d3d45', lineHeight: 1.65, margin: 0 }}>{role.why}</p>
                    </div>

                    {/* Skill gaps */}
                    {role.skillGaps.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#b0b0b8', marginBottom: 5 }}>Skill gaps</div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {role.skillGaps.map((gap, j) => (
                            <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, color: '#5a5a65', lineHeight: 1.5 }}>
                              <span style={{ color: '#b8750a', fontSize: 11, marginTop: 2, flexShrink: 0 }}>▲</span>
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      onClick={() => goSearch(role.searchQuery)}
                      style={{ marginTop: 'auto', background: '#f4f2ed', color: '#2d5be3', border: '1px solid rgba(45,91,227,.2)', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                    >
                      <span>Search "{role.searchQuery}" jobs</span>
                      <span>→</span>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Free upsell */}
            {!result.isPro && (
              <div style={{ marginTop: 20, background: 'rgba(124,92,191,0.06)', border: '1px solid rgba(124,92,191,0.2)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: '#5a3a7a', fontWeight: 600 }}>Get 2 more roles + richer insights</span>
                  <span style={{ fontSize: 12.5, color: '#7c5cbf', display: 'block', marginTop: 2 }}>Pro runs 6 paths with deeper skill analysis and uses Claude Sonnet instead of Haiku.</span>
                </div>
                <button onClick={() => router.push('/')} style={{ background: '#7c5cbf', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', flexShrink: 0 }}>
                  Upgrade to Pro
                </button>
              </div>
            )}

            {/* Re-explore */}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                onClick={() => { setStep('setup'); setResult(null) }}
                style={{ background: 'none', border: 'none', color: '#b0b0b8', fontSize: 12.5, cursor: 'pointer', fontFamily: 'sans-serif' }}
              >
                Explore a different direction →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#b0b0b8', fontSize: 14 }}>Loading…</div>}>
      <ExploreInner />
    </Suspense>
  )
}
