'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import './landing.css'

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeEntry, setActiveEntry] = useState<number | null>(null)
  const [mastVisible, setMastVisible] = useState(false)
  const [a11yOpen, setA11yOpen] = useState(false)
  const [a11y, setA11y] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let raf: number | null = null
    function onScroll() {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        setMastVisible(y > 80)
        const stage = document.getElementById('heroStage')
        if (stage) {
          const t = Math.max(0, Math.min(1, y / window.innerHeight))
          stage.style.transform = `translateY(${-y * 0.18}px) scale(${1 - t * 0.03})`
          stage.style.opacity = String(1 - t * 0.55)
        }
        const rule = document.getElementById('progressRule')
        if (rule) {
          const max = document.documentElement.scrollHeight - window.innerHeight
          const p = max > 0 ? Math.min(1, y / max) * 100 : 0
          rule.style.setProperty('--progress', p.toFixed(1) + '%')
          const label = document.getElementById('progressLabel')
          if (label) label.textContent = `fitted. · ${String(Math.round(p)).padStart(2, '0')}%`
        }
        raf = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    const chipIO = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); chipIO.unobserve(e.target) } }),
      { threshold: 0.35 }
    )
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    document.querySelectorAll('.running-header').forEach(el => chipIO.observe(el))
    return () => { io.disconnect(); chipIO.disconnect() }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      const m = document.getElementById('mastMenu')
      if (m && !m.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpen])

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const dot  = document.querySelector<HTMLElement>('.cursor-dot')
    const ring = document.querySelector<HTMLElement>('.cursor-ring')
    if (!dot || !ring) return
    let x = window.innerWidth / 2, y = window.innerHeight / 2
    let rx = x, ry = y
    let rafId: number
    const d = dot, r = ring
    function onMove(e: MouseEvent) { x = e.clientX; y = e.clientY; d.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)` }
    function frame() { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; r.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; rafId = requestAnimationFrame(frame) }
    window.addEventListener('mousemove', onMove, { passive: true })
    rafId = requestAnimationFrame(frame)
    const root = document.querySelector<HTMLElement>('.page-root')
    const targets = document.querySelectorAll('a, button, .btn-primary, [data-hover]')
    targets.forEach(el => {
      el.addEventListener('mouseenter', () => root?.classList.add('cursor-active'))
      el.addEventListener('mouseleave', () => root?.classList.remove('cursor-active'))
    })
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(rafId) }
  }, [])

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem('fitted.a11y') || '{}'); setA11y(saved) } catch {}
  }, [])

  useEffect(() => {
    document.body.classList.toggle('a11y-large-text',    !!a11y['large-text'])
    document.body.classList.toggle('a11y-reduce-motion', !!a11y['reduce-motion'])
    document.body.classList.toggle('a11y-contrast',      !!a11y['contrast'])
    try { localStorage.setItem('fitted.a11y', JSON.stringify(a11y)) } catch {}
  }, [a11y])

  useEffect(() => {
    if (!a11yOpen) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setA11yOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [a11yOpen])

  return (
    <div className="page-root" style={{ background: '#15151a', color: '#f1ede4', minHeight: '100vh' }}>
      <div className="cursor-dot" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />

      {/* Progress */}
      <div id="progressRule" className="progress-rule" aria-hidden="true" />
      <div id="progressLabel" className="progress-label" aria-hidden="true">fitted.</div>

      {/* ══ MASTHEAD ══ */}
      <header id="masthead" className={`masthead${mastVisible ? ' mast-visible' : ''}`}>
        <a href="#top" className="mast-left" aria-label="fitted. — back to top">
          <span className="mast-f">fitted</span><span className="mast-dot-sm">.</span>
        </a>
        <div className="mast-center" aria-hidden="true"><span className="pip" /></div>
        <div className="mast-right">
          <div className="mast-menu" id="mastMenu" data-open={menuOpen ? 'true' : 'false'}>
            <button type="button" className="mast-menu-trigger" onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
              aria-haspopup="true" aria-expanded={menuOpen} aria-controls="mastMenuPanel">
              <span className="menu-bars" aria-hidden="true"><span /><span /></span>
              <span>{menuOpen ? 'Close' : 'Menu'}</span>
            </button>
            <div className="mast-menu-panel" id="mastMenuPanel" role="menu">
              <div className="mast-menu-eyebrow">The reading</div>
              <ul className="mast-menu-list" role="none">
                {[['#top','—','The Beginning'],['#guide','I.','The Guide'],['#capabilities','II.','Capabilities'],['#return','III.','On Returning'],['#pricing-section','IV.','Plans & Pricing'],['#start','V.','On Your Device'],['#follow','VI.','Follow']].map(([href,num,label]) => (
                  <li key={href} role="none">
                    <a role="menuitem" href={href} onClick={() => setMenuOpen(false)}>
                      <span className="mn-num">{num}</span><span>{label}</span><span className="mn-arrow">→</span>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mast-menu-foot">A second reader for the work of your <em>life</em>.</div>
            </div>
          </div>
          <Link href="/auth" className="mast-cta">Get Started <span>→</span></Link>
        </div>
      </header>

      <main id="main">
        {/* ══ HERO ══ */}
        <section className="hero" id="top">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-guide left" aria-hidden="true" />
          <div className="hero-guide right" aria-hidden="true" />
          <div className="hero-stage" id="heroStage">
            <div className="wordmark" aria-label="fitted.">
              <span className="wordmark-f" aria-hidden="true">
                <span className="ch">f</span><span className="ch">i</span><span className="ch">t</span><span className="ch">t</span><span className="ch">e</span><span className="ch">d</span>
              </span>
              <span className="wordmark-dot" aria-hidden="true"><span className="dot-inner">.</span></span>
            </div>
            <div className="hero-publish-center">
              <h1 className="hero-headline">Get <em>fitted</em> for your future.</h1>
              <p className="hero-lede">
                Intelligent career guidance that <em>actually knows you</em> — your background, your values, and the full picture of your path. Whether you&apos;re pivoting, returning, or simply done with searches that don&apos;t see you. <em>Something more honest, and more useful.</em>
              </p>
              <div className="hero-cta-stack">
                <Link href="/auth" className="btn-primary">
                  Get Started
                  <span className="arrow" aria-hidden="true">
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5h8.5M6 1l3.5 3.5L6 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </Link>
                <div className="pub-note">
                  <span className="dot" />
                  <span>Now open · Free to start, no card required</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-foot" aria-hidden="true">
            <div><span>fitted.</span></div>
            <div><span>Scroll for the full reading</span></div>
          </div>
        </section>

        {/* ══ MARQUEE ══ */}
        <aside className="marquee-band" aria-label="Tagline marquee">
          <div className="marquee-track">
            {[0,1].map(g => (
              <div key={g} className="marquee-group" aria-hidden={g === 1}>
                {['Career guidance that actually knows you','Get fitted for your future','A second reader for the work of your life','Made for the moves that matter','Something more honest, and more useful'].map((t,i) => (
                  <span key={i} className="marquee-text">{t}</span>
                )).flatMap((el, i, arr) => i < arr.length - 1 ? [el, <span key={`d${i}`} className="marquee-dot" />] : [el])}
              </div>
            ))}
          </div>
        </aside>

        {/* ══ I. THE GUIDE ══ */}
        <section className="section" id="guide">
          <div className="section-inner">
            <div className="running-header reveal">
              <span className="running-num">I.</span>
              <span className="running-chip" aria-hidden="true" />
              <span className="running-title">The Guide</span>
              <span className="running-meta">Reading 01 of 04</span>
            </div>
            <div className="prose-grid">
              <h2 className="prose-headline reveal d1">Not a job board.<br />A <em>guide</em> that knows you.</h2>
              <div className="reveal d2">
                <p className="prose-body">fitted. reads your background, learns your preferences, and scores every real opening against who you actually are — not just your keywords. It tells you where you stand, what&apos;s working, and <em>what you need to hear, even if no one else will say it.</em></p>
                <p className="prose-body">When you return after time away — a career break, a parental leave, a field change — fitted. checks in. A short, considered conversation sees where things stand now and recalibrates everything to match.</p>
              </div>
            </div>
            <div className="feature-feature">
              <div className="reveal d1">
                <div className="tease-card">
                  <div className="tease-head">
                    <span className="tease-head-title">Your matches today</span>
                    <span className="tease-head-meta">12 new</span>
                  </div>
                  <div className="tease-body">
                    <div className="tease-row">
                      <div className="tease-ring ring-high">94</div>
                      <div className="tease-info"><div className="tease-role">Director of Product Strategy</div><div className="tease-co">Lattice — Remote</div></div>
                      <span className="tease-tag">New</span>
                    </div>
                    <div className="tease-row">
                      <div className="tease-ring ring-high">88</div>
                      <div className="tease-info"><div className="tease-role">Head of Growth</div><div className="tease-co">Runway Financial — New York</div></div>
                      <span className="tease-tag">Saved</span>
                    </div>
                    <div className="tease-row">
                      <div className="tease-ring ring-mid">76</div>
                      <div className="tease-info"><div className="tease-role">Senior PM, Platform</div><div className="tease-co">Figma — San Francisco</div></div>
                      <span className="tease-tag">Worth a look</span>
                    </div>
                    <div className="tease-insight">
                      <div className="tease-insight-label">fitted. thinks</div>
                      <div className="tease-insight-text">Your cross-functional leadership is underrepresented. That gap is costing you first-round interviews.</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="reveal d2">
                <h3 className="prose-headline" style={{fontSize:'clamp(1.75rem,3.4vw,2.5rem)'}}>A <em>second reader</em> for the work of your life.</h3>
                <p className="prose-body" style={{marginTop:'1.25rem'}}>Every opening is scored against your real profile — not keywords. fitted. shows you where the fit is, where the gap is, and what to do about it before you apply.</p>
                <p className="prose-body" style={{marginTop:'1rem'}}>It is, intentionally, slower. It reads the way you would, if you had the time.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="section-rule" />

        {/* ══ II. CAPABILITIES ══ */}
        <section className="section" id="capabilities">
          <div className="section-inner">
            <div className="running-header reveal">
              <span className="running-num">II.</span>
              <span className="running-chip" aria-hidden="true" />
              <span className="running-title">Capabilities</span>
              <span className="running-meta">Six readings, six tools</span>
            </div>
            <div className="prose-grid reveal d1">
              <h2 className="prose-headline">Everything your search is <em>missing</em>.</h2>
              <p className="prose-body">Built for people who are serious about their next move — early career, pivoting, or returning. Each tool exists because the alternative — a job board, a recruiter, a tab full of advice — quietly fails the people it claims to serve.</p>
            </div>
            <div className="entries">
              {[
                { num:'i.',  title:'Match scoring',          body:'Every opening in your feed is scored against your real profile — not keyword matching. Know exactly why a role is, or isn\'t, worth your time.',       meta:'Reading no. 1' },
                { num:'ii.', title:'A clean tracker',        body:'A clean pipeline for your applications. Deadlines, notes, contacts — all in one place. Never lose track of where you stand.',                           meta:'Reading no. 2' },
                { num:'iii.',title:'Résumé intelligence',    body:'Maintain multiple tailored résumés. Per-job optimization with ATS scoring, impact-language analysis, and specific rewrites — never generic.',            meta:'Reading no. 3' },
                { num:'iv.', title:'Paste-a-job parsing',    body:'Copy any job description and paste it in. fitted. parses it, scores your fit, and tells you what to adjust before applying.',                          meta:'Reading no. 4' },
                { num:'v.',  title:'A profile that grows up',body:'Build a rich profile once. fitted. learns your story — what you value, where you\'ve been, what you\'re not willing to compromise on.',                 meta:'Reading no. 5' },
                { num:'vi.', title:'Salary & interview',     body:'Negotiation scripts built around your specific offer — because you should know exactly what to ask for, and how to ask for it. Plus per-role interview prep drawn from the actual job description.', meta:'Reading no. 6 · Pro' },
              ].map((e, i) => (
                <div key={i} className={`entry reveal ${i % 2 === 0 ? 'd1' : 'd2'}`}
                  data-active={activeEntry === i ? 'true' : 'false'}
                  onClick={() => setActiveEntry(p => p === i ? null : i)}>
                  <span className="entry-num">{e.num}</span>
                  <span className="entry-toggle" aria-hidden="true">+</span>
                  <h3 className="entry-title" dangerouslySetInnerHTML={{__html: e.num === 'vi.' ? 'Salary &amp; interview <em style="font-style:italic;color:var(--taupe);">(pro)</em>' : e.title}} />
                  <div className="entry-stage">
                    <p className="entry-body">{e.body}</p>
                    <div className="entry-graphic" aria-hidden="true">
                      {i === 0 && <svg viewBox="0 0 220 220"><defs><linearGradient id="g_arc" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#5171BF"/><stop offset="100%" stopColor="#6f8bd8"/></linearGradient></defs><circle cx="110" cy="110" r="80" fill="none" stroke="rgba(184,169,154,.2)" strokeWidth="0.8"/><circle cx="110" cy="110" r="62" fill="none" stroke="rgba(184,169,154,.3)" strokeWidth="0.8"/><circle cx="110" cy="110" r="46" fill="none" stroke="url(#g_arc)" strokeWidth="3" strokeDasharray="270 290" strokeLinecap="round" transform="rotate(-90 110 110)"/><text x="110" y="118" textAnchor="middle" fontFamily="var(--display)" fontSize="38" fill="#f1ede4">94</text><text x="110" y="142" textAnchor="middle" fontFamily="var(--sans)" fontSize="8" letterSpacing="3" fill="#b8a99a">FIT SCORE</text></svg>}
                      {i === 1 && <svg viewBox="0 0 220 220"><text x="40" y="42" fontFamily="var(--sans)" fontSize="8" letterSpacing="2" fill="#b8a99a">SAVED</text><text x="100" y="42" fontFamily="var(--sans)" fontSize="8" letterSpacing="2" fill="#b8a99a">APPLIED</text><text x="172" y="42" fontFamily="var(--sans)" fontSize="8" letterSpacing="2" fill="#b8a99a">CALL</text><g stroke="rgba(184,169,154,.18)" strokeWidth="0.8" strokeDasharray="2 3"><line x1="40" y1="52" x2="40" y2="190"/><line x1="100" y1="52" x2="100" y2="190"/><line x1="172" y1="52" x2="172" y2="190"/></g><rect x="22" y="58" width="48" height="22" fill="rgba(241,237,228,.04)" stroke="rgba(241,237,228,.28)" strokeWidth="0.7"/><line x1="28" y1="68" x2="55" y2="68" stroke="rgba(241,237,228,.6)" strokeWidth="0.8"/><line x1="28" y1="74" x2="50" y2="74" stroke="rgba(241,237,228,.3)" strokeWidth="0.6"/><rect x="22" y="90" width="48" height="22" fill="rgba(241,237,228,.04)" stroke="rgba(241,237,228,.28)" strokeWidth="0.7"/><line x1="28" y1="100" x2="58" y2="100" stroke="rgba(241,237,228,.6)" strokeWidth="0.8"/><rect x="82" y="106" width="48" height="22" fill="rgba(81,113,191,.18)" stroke="#5171BF" strokeWidth="1"/><line x1="88" y1="116" x2="120" y2="116" stroke="#5171BF" strokeWidth="0.9"/><rect x="154" y="58" width="48" height="22" fill="rgba(241,237,228,.04)" stroke="rgba(241,237,228,.28)" strokeWidth="0.7"/><line x1="160" y1="68" x2="190" y2="68" stroke="rgba(241,237,228,.6)" strokeWidth="0.8"/></svg>}
                      {i === 2 && <svg viewBox="0 0 220 220"><rect x="55" y="28" width="110" height="164" fill="rgba(241,237,228,.04)" stroke="rgba(241,237,228,.28)" strokeWidth="0.8"/><line x1="68" y1="50" x2="124" y2="50" stroke="#f1ede4" strokeWidth="2.5"/><line x1="68" y1="60" x2="148" y2="60" stroke="rgba(241,237,228,.4)" strokeWidth="0.7"/><line x1="68" y1="78" x2="150" y2="78" stroke="rgba(241,237,228,.3)" strokeWidth="0.7"/><rect x="68" y="112" width="52" height="6" fill="#5171BF" opacity="0.8"/><line x1="68" y1="128" x2="150" y2="128" stroke="rgba(241,237,228,.3)" strokeWidth="0.7"/><rect x="68" y="152" width="34" height="6" fill="#b8a99a" opacity="0.85"/></svg>}
                      {i === 3 && <svg viewBox="0 0 220 220"><rect x="22" y="38" width="92" height="142" fill="rgba(241,237,228,.04)" stroke="rgba(241,237,228,.25)" strokeWidth="0.7"/><line x1="32" y1="54" x2="100" y2="54" stroke="rgba(241,237,228,.5)" strokeWidth="0.7"/><line x1="32" y1="66" x2="106" y2="66" stroke="rgba(241,237,228,.32)" strokeWidth="0.6"/><line x1="32" y1="76" x2="98" y2="76" stroke="rgba(241,237,228,.32)" strokeWidth="0.6"/><line x1="114" y1="64" x2="142" y2="64" stroke="#5171BF" strokeWidth="0.7" strokeDasharray="2 2"/><rect x="142" y="56" width="58" height="18" rx="2" fill="rgba(81,113,191,.15)" stroke="#5171BF" strokeWidth="0.9"/><text x="171" y="68" textAnchor="middle" fontFamily="var(--sans)" fontSize="9" fill="#6f8bd8" letterSpacing="1.5">ROLE</text><rect x="142" y="86" width="58" height="18" rx="2" fill="rgba(184,169,154,.15)" stroke="#b8a99a" strokeWidth="0.9"/><text x="171" y="98" textAnchor="middle" fontFamily="var(--sans)" fontSize="9" fill="#b8a99a" letterSpacing="1.5">SKILLS</text><rect x="142" y="116" width="58" height="18" rx="2" fill="rgba(241,237,228,.08)" stroke="rgba(241,237,228,.45)" strokeWidth="0.9"/><text x="171" y="128" textAnchor="middle" fontFamily="var(--sans)" fontSize="9" fill="rgba(241,237,228,.75)" letterSpacing="1.5">FIT 88</text></svg>}
                      {i === 4 && <svg viewBox="0 0 220 220"><g fill="none" strokeWidth="0.9"><circle cx="110" cy="108" r="92" stroke="rgba(184,169,154,.12)" strokeDasharray="2 4"/><circle cx="110" cy="108" r="74" stroke="rgba(184,169,154,.22)"/><circle cx="110" cy="108" r="56" stroke="rgba(184,169,154,.35)"/><circle cx="110" cy="108" r="38" stroke="rgba(184,169,154,.5)"/><circle cx="110" cy="108" r="22" stroke="#b8a99a"/></g><circle cx="110" cy="108" r="9" fill="#5171BF"/><text x="110" y="14" textAnchor="middle" fontFamily="var(--sans)" fontSize="8" letterSpacing="2" fill="#b8a99a">FUTURE YOU</text></svg>}
                      {i === 5 && <svg viewBox="0 0 220 220"><rect x="20" y="44" width="110" height="48" rx="3" fill="rgba(241,237,228,.05)" stroke="rgba(241,237,228,.3)" strokeWidth="0.8"/><path d="M34 92 L40 106 L46 92 Z" fill="rgba(241,237,228,.05)" stroke="rgba(241,237,228,.3)" strokeWidth="0.8"/><line x1="32" y1="60" x2="116" y2="60" stroke="rgba(241,237,228,.55)" strokeWidth="0.8"/><line x1="32" y1="72" x2="100" y2="72" stroke="rgba(241,237,228,.35)" strokeWidth="0.7"/><rect x="90" y="120" width="110" height="48" rx="3" fill="rgba(81,113,191,.12)" stroke="#5171BF" strokeWidth="0.9"/><path d="M174 168 L180 182 L186 168 Z" fill="rgba(81,113,191,.12)" stroke="#5171BF" strokeWidth="0.9"/><line x1="102" y1="136" x2="186" y2="136" stroke="#5171BF" strokeWidth="0.8"/><text x="155" y="108" textAnchor="middle" fontFamily="var(--display)" fontSize="34" fill="#5171BF">$</text></svg>}
                    </div>
                  </div>
                  <div className="entry-meta">— {e.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-rule" />

        {/* ══ PULL QUOTE ══ */}
        <section className="pullquote reveal" id="pullquote-room">
          <div className="pullquote-inner">
            <span className="pullquote-mark" aria-hidden="true">&ldquo;</span>
            <q>Welcome back. Let&apos;s get you closer to the right next <em>fit</em>.</q>
            <div className="pullquote-attr">fitted., when you need it most</div>
          </div>
        </section>

        <div className="section-rule" />

        {/* ══ III. ON RETURNING ══ */}
        <section className="section" id="return">
          <div className="section-inner">
            <div className="running-header reveal">
              <span className="running-num">III.</span>
              <span className="running-chip" aria-hidden="true" />
              <span className="running-title">On Returning</span>
              <span className="running-meta">A short chapter</span>
            </div>
            <div className="prose-grid">
              <h2 className="prose-headline reveal d1">It learns. It waits.<br />Then it <em>checks in</em>.</h2>
              <div className="reveal d2">
                <p className="prose-body">fitted. isn&apos;t a one-time tool. It grows with your career. Come back after a promotion, a pivot, or time away — and it already knows who you are.</p>
                <p className="prose-body">A short conversation sees how things have shifted, recalibrates your matches, and resets your guidance for where you are <em>now</em>.</p>
              </div>
            </div>
            <div className="timeline reveal d3">
              {[
                { svg: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="rgba(107,203,143,.6)" strokeWidth="1.2"/><path d="M4 7l2 2 4-4" stroke="rgba(107,203,143,.8)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, heading: 'You tell fitted. who you are', text: 'Answer a few questions about your background, goals, and what matters to you. fitted. builds your profile from the start — no résumé upload required.' },
                { svg: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="rgba(81,113,191,.6)" strokeWidth="1.2"/><circle cx="7" cy="7" r="2.5" stroke="rgba(81,113,191,.8)" strokeWidth="1.2"/></svg>, heading: 'fitted. tracks your progress', text: 'Every application, saved role, and piece of feedback trains your profile. fitted. gets sharper the more you use it.' },
                { svg: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="rgba(184,169,154,.6)" strokeWidth="1.2"/><path d="M7 4v3l2 1" stroke="rgba(184,169,154,.8)" strokeWidth="1.2" strokeLinecap="round"/></svg>, heading: 'Your goals evolve — so does fitted.', text: 'Returning after time away? Pivoting industries? A short check-in recalibrates everything — your matches, your résumé targets, your salary data.' },
                { svg: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="rgba(201,124,93,.6)" strokeWidth="1.2"/><path d="M4.5 7h5M7 4.5l2.5 2.5L7 9.5" stroke="rgba(201,124,93,.8)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, heading: 'Always in your corner', text: 'Whether you\'re actively searching, quietly watching, or just coming back after a break, fitted. stays ready. Come back any time — it picks up right where you left off.' },
              ].map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot">{item.svg}</div>
                  <div><div className="timeline-heading">{item.heading}</div><div className="timeline-text">{item.text}</div></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-rule" />

        {/* ══ PLANS & PRICING ══ */}
        <section className="section" id="pricing-section">
          <div className="section-inner">
            <div className="running-header reveal">
              <span className="running-num">IV.</span>
              <span className="running-chip" aria-hidden="true" />
              <span className="running-title">Plans &amp; Pricing</span>
              <span className="running-meta">Three tiers, one decision</span>
            </div>
            <div className="prose-grid reveal d1" style={{marginBottom:'0'}}>
              <h2 className="prose-headline">Start free. Upgrade when it <em>earns it</em>.</h2>
              <p className="prose-body">Start with everything you need to take your search seriously. Upgrade when fitted. is doing real work for you — not before.</p>
            </div>
            <div className="price-cards">
              <div className="price-card reveal d1">
                <span className="price-badge price-badge-free">Free forever</span>
                <div className="price-name">The essentials</div>
                <div className="price-amount"><span className="price-num">$0</span><span className="price-per">forever</span></div>
                <div className="price-billing">No trial timer. No catch.</div>
                <p className="price-desc">A real, working career companion — not a teaser. Everything you need to start a serious search.</p>
                <ul className="price-features">
                  <li>Curated job feed, scored to you</li>
                  <li>Personal résumé, kept tidy</li>
                  <li>Clean application tracker</li>
                  <li>Match scoring with real reasoning</li>
                  <li>Notes &amp; reminders, never lost</li>
                </ul>
                <Link href="/auth" className="price-cta price-cta-free">Start free →</Link>
              </div>
              <div className="price-card featured reveal d2">
                <span className="price-badge price-badge-pro">★ Most popular</span>
                <div className="price-name">Pro, made for momentum</div>
                <div className="price-amount"><span className="price-num">$9</span><span className="price-per">/ month</span></div>
                <div className="price-billing">or $89/year — <em>save two months</em></div>
                <p className="price-desc">Real résumé work, real interview prep, real negotiation scripts — not the generic kind.</p>
                <ul className="price-features">
                  <li>30 AI actions per month</li>
                  <li>Unlimited tailored résumés</li>
                  <li>Résumé optimizer with ATS scoring</li>
                  <li>Interview prep, drawn from the role</li>
                  <li>Salary negotiation scripts</li>
                  <li>Career coach chats</li>
                  <li>Full job feed &amp; tracker</li>
                </ul>
                <Link href="/auth" className="price-cta price-cta-pro">Go Pro →</Link>
              </div>
              <div className="price-card premium reveal d3">
                <span className="price-badge price-badge-prem">◈ Premium</span>
                <div className="price-name">Premium, no limits</div>
                <div className="price-amount"><span className="price-num">$18</span><span className="price-per">/ month</span></div>
                <div className="price-billing">or $180/year — <em>save two months</em></div>
                <p className="price-desc">For executives, pivoters, and anyone in the middle of a big move. <em>Unlimited everything, plus priority support.</em></p>
                <ul className="price-features">
                  <li>Unlimited AI actions</li>
                  <li>Everything in Pro, with no caps</li>
                  <li>Unlimited résumé optimization</li>
                  <li>Unlimited interview prep &amp; negotiation</li>
                  <li>Unlimited coach chats</li>
                  <li>Priority support &amp; early feature access</li>
                </ul>
                <Link href="/auth" className="price-cta price-cta-prem">Go Premium →</Link>
              </div>
            </div>
            <p className="price-footnote">Cancel any time. No long-term contracts. Annual billing saves two months on every paid plan.</p>
          </div>
        </section>

        <div className="section-rule" />

        {/* ══ V. ON YOUR DEVICE ══ */}
        <section className="section" id="start">
          <div className="section-inner">
            <div className="running-header reveal">
              <span className="running-num">V.</span>
              <span className="running-chip" aria-hidden="true" />
              <span className="running-title">On Your Device</span>
              <span className="running-meta">Add to home screen</span>
            </div>
            <div className="prose-grid">
              <h2 className="prose-headline reveal d1">Add fitted. to your <em>home screen</em>.</h2>
              <div className="reveal d2">
                <p className="prose-body">fitted. lives on your phone, not in a browser tab. Installed, it opens like an app — fast, full-screen, and there when you need it.</p>
              </div>
            </div>
            <div className="install-grid">
              <article className="install-card reveal d1">
                <header className="install-card-head">
                  <div className="install-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#f1ede4"/></svg>
                  </div>
                  <div><div className="install-platform">iPhone &amp; iPad</div><div className="install-sub">Safari only</div></div>
                </header>
                <ol className="install-steps">
                  {[['Open fitted. in Safari','Chrome on iOS doesn\'t support installation — use Safari.'],['Tap the Share button','A box with an arrow pointing upward, at the bottom of the screen.'],['Choose Add to Home Screen','Scroll down in the share sheet if you don\'t see it.'],['Tap Add','fitted. now opens like any other app — full-screen, no browser chrome.']].map(([text,note],i)=>(
                    <li key={i} className="install-step">
                      <span className="install-step-num">{i+1}</span>
                      <div><div className="install-step-text" dangerouslySetInnerHTML={{__html:text}}/><div className="install-step-note">{note}</div></div>
                    </li>
                  ))}
                </ol>
                <div className="install-app-preview">
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                    <div className="install-app-tile" aria-hidden="true">
                      <span style={{fontFamily:'var(--display)',fontSize:'2.5rem',color:'var(--off-white)',lineHeight:1,letterSpacing:'-.04em'}}>f</span>
                      <span style={{fontFamily:'var(--display)',fontStyle:'italic',fontSize:'2.5rem',color:'var(--taupe)',lineHeight:1}}>.</span>
                    </div>
                    <div className="install-app-label">fitted.</div>
                  </div>
                  <div className="install-app-note">This is how fitted. will appear on your home screen.</div>
                </div>
              </article>
              <article className="install-card reveal d2">
                <header className="install-card-head">
                  <div className="install-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.25" stroke="#f1ede4" strokeWidth="1.4"/><circle cx="12" cy="12" r="3.2" fill="#f1ede4"/></svg>
                  </div>
                  <div><div className="install-platform">Android &amp; Chrome</div><div className="install-sub">Chrome · Edge · Brave</div></div>
                </header>
                <ol className="install-steps">
                  {[['Open fitted. in Chrome','Works the same in Edge and Brave on Android or desktop.'],['Tap the three-dot menu','Top-right corner. On desktop, look for an install icon in the address bar.'],['Choose Install app','Or Add to Home Screen — wording varies slightly by browser.'],['Confirm Install','fitted. opens in its own window — like a native app, separate from your browser.']].map(([text,note],i)=>(
                    <li key={i} className="install-step">
                      <span className="install-step-num">{i+1}</span>
                      <div><div className="install-step-text" dangerouslySetInnerHTML={{__html:text}}/><div className="install-step-note">{note}</div></div>
                    </li>
                  ))}
                </ol>
                <div className="install-callout">
                  <div className="install-callout-label">Why install?</div>
                  <div className="install-callout-text">Faster load. Offline access to your saved roles and notes. Gentle nudges when a strong match appears — nothing more.</div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ══ SOCIAL ══ */}
        <section className="social-band reveal" id="follow">
          <div className="social-eyebrow">Follow our journey</div>
          <h2 className="social-headline">Find us where you <em>spend time</em>.</h2>
          <div className="social-handle">@fittedcareers</div>
          <nav className="social-row" aria-label="Social media">
            {[
              { href:'https://instagram.com/fittedcareers', label:'Instagram', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg> },
              { href:'https://tiktok.com/@fittedcareers', label:'TikTok', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.6 7.7a5.5 5.5 0 0 1-3.4-1.2A5.6 5.6 0 0 1 14.3 3h-3.2v12.4a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6.05.9.13V9.55a5.9 5.9 0 0 0-.9-.07A5.85 5.85 0 1 0 14.3 15.3V9.74a8.7 8.7 0 0 0 5.3 1.8V8.36c0 0 0-.6 0-.66z"/></svg> },
              { href:'https://youtube.com/@fittedcareers', label:'YouTube', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5C.1 8.4.1 12 .1 12s0 3.6.4 5.5a3 3 0 0 0 2.1 2.1C4.5 20 12 20 12 20s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1c.4-1.9.4-5.5.4-5.5s0-3.6-.4-5.5zM9.75 15.5v-7L15.8 12l-6.05 3.5z"/></svg> },
              { href:'https://threads.net/@fittedcareers', label:'Threads', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.69 11.12c-.08-.04-.16-.07-.24-.11-.14-2.62-1.57-4.12-3.98-4.13-1.45-.01-2.66.61-3.39 1.74l1.32.91c.55-.84 1.42-1.02 2.05-1.02.79.01 1.39.24 1.78.69.28.33.47.78.56 1.35-.69-.12-1.44-.15-2.25-.11-2.26.13-3.71 1.45-3.61 3.28.05.93.51 1.73 1.31 2.25.67.44 1.54.66 2.44.61 1.19-.07 2.13-.52 2.78-1.35.5-.63.81-1.45.95-2.48.55.34.97.78 1.2 1.32.39.91.41 2.4-.8 3.61-1.06 1.06-2.34 1.52-4.27 1.54-2.14-.02-3.76-.7-4.83-2.04-1-1.25-1.51-3.06-1.53-5.38.02-2.32.53-4.13 1.53-5.38 1.06-1.34 2.69-2.03 4.83-2.04 2.15.02 3.8.71 4.91 2.05.54.66.95 1.5 1.22 2.49l1.6-.43c-.33-1.24-.85-2.31-1.57-3.21C18.43 4.45 16.38 3.55 13.74 3.53h-.01c-2.63.02-4.66 1.02-6.05 2.97-1.37 1.81-2.21 3.59-2.39 5.73l.13 1.3-.13 1.3c.17 2.13 1.03 3.91 2.39 5.18 1.4 1.3 3.43 2.27 6.05 2.29h.01c2.55-.02 4.4-.67 5.91-2.06 1.71-1.58 1.66-3.47 1.14-4.63-.37-.82-1.07-1.49-2.03-1.97z"/></svg> },
            ].map(s => (
              <a key={s.label} className="social-link" href={s.href} rel="me noopener" target="_blank" aria-label={`fitted. on ${s.label}`}>
                {s.icon}{s.label}
              </a>
            ))}
          </nav>
        </section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer>
        <div className="footer-grid">
          <div className="foot-mark">
            <div className="foot-mark-logo"><span className="f">fitted</span><span className="d">.</span></div>
            <p className="foot-strap">Career guidance for people who want work that actually fits.</p>
          </div>
          <div className="foot-col">
            <h5>The Reading</h5>
            <ul>
              <li><a href="#guide">The Guide</a></li>
              <li><a href="#capabilities">Capabilities</a></li>
              <li><a href="#return">On Returning</a></li>
              <li><a href="#pricing-section">Plans &amp; Pricing</a></li>
              <li><a href="#start">Install</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h5>Product</h5>
            <ul>
              <li><Link href="/auth">Get Started</Link></li>
              <li><Link href="/auth">Sign In</Link></li>
              <li><a href="#pricing-section">Pricing</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h5>Legal</h5>
            <ul>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Accessibility</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© MMXXVI fitted. — All rights reserved</span>
          <span>fitted.</span>
        </div>
      </footer>

      <aside className="legal-note" role="contentinfo">
        fitted. is intended for users aged 13 and older.
        <span className="legal-pip" aria-hidden="true" />
        Designed to meet WCAG 2.1 AA. Trouble accessing? Email{' '}
        <a href="mailto:accessibility@fitted.app" style={{color:'var(--taupe)',textDecoration:'underline',textUnderlineOffset:'3px'}}>accessibility@fitted.app</a>.
      </aside>

      {/* ══ A11Y FAB ══ */}
      <div
        id="a11yPanel"
        className={`a11y-panel${a11yOpen ? ' open' : ''}`}
        role="dialog"
        aria-labelledby="a11yPanelTitle"
        aria-hidden={!a11yOpen}
      >
        <div className="a11y-panel-head">
          <span className="a11y-panel-title" id="a11yPanelTitle">Accessibility Options</span>
          <button type="button" className="a11y-panel-reset" onClick={() => setA11y({})}>Reset all</button>
        </div>
        {([['large-text','Larger text'],['reduce-motion','Reduce motion'],['contrast','High contrast']] as [string,string][]).map(([key, label]) => (
          <div key={key} className="a11y-row">
            <span className="a11y-row-label">{label}</span>
            <button
              type="button"
              className="a11y-toggle"
              role="switch"
              aria-checked={!!a11y[key]}
              aria-label={label}
              onClick={() => setA11y(s => ({ ...s, [key]: !s[key] }))}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        id="a11yFab"
        className="a11y-fab"
        aria-label="Accessibility options"
        aria-expanded={a11yOpen}
        aria-controls="a11yPanel"
        onClick={(e) => { e.stopPropagation(); setA11yOpen(o => !o) }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="4.5" r="1.5"/>
          <path d="M12 7.5v6M9 10.5h6M10 17l-2 4M14 17l2 4"/>
        </svg>
      </button>
    </div>
  )
}
