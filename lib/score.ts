// fitted. — Server-side match scoring
// Pure TypeScript — no network calls, no AI.
// Called once per job per request, with user context from profile + active resume.

import type { Job } from './jobs'
import { FIELD_TAGS } from './adzuna'

export interface ScoringContext {
  resumeText:  string   // concatenated active resume text
  aboutMe:     string
  careerField: string   // e.g. 'marketing'
  careerStage: string   // 'college' | 'recent' | 'working' | 'changing' | 'returning'
  payTarget:   string   // e.g. '$55,000/yr' or '$26/hr' — freeform
  locations:   string[] // e.g. ['New York', 'Remote']
}

// ── Text helpers ─────────────────────────────────────────────────────────────

// Tokenize into lowercase words with length > 3, strip stopwords
const STOPWORDS = new Set([
  'with','that','this','have','from','they','will','been','their','were',
  'which','when','what','your','about','more','also','into','than','then',
  'some','over','such','each','make','most','other','time','very','just',
  'like','only','come','work','well','need','able','using','team','role',
  'experience','skills','required','preferred','responsibilities','position',
  'company','looking','candidate','excellent','strong','ability','knowledge',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
}

// ── Pay parsing ──────────────────────────────────────────────────────────────

function parsePayToAnnual(raw: string): number | null {
  if (!raw) return null
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''))
  if (isNaN(n) || n === 0) return null
  // If it looks hourly (< 300) convert to annual
  return n < 300 ? n * 2080 : n
}

// ── Seniority signals ────────────────────────────────────────────────────────

const SENIOR_SIGNALS = ['senior','sr.','lead','principal','staff','director','head','vp','manager','ii','iii']
const ENTRY_SIGNALS  = ['coordinator','associate','assistant','junior','jr.','entry','analyst','specialist']

function seniorityOfTitle(title: string): 'senior' | 'mid' | 'entry' {
  const t = title.toLowerCase()
  if (SENIOR_SIGNALS.some(s => t.includes(s))) return 'senior'
  if (ENTRY_SIGNALS.some(s => t.includes(s)))  return 'entry'
  return 'mid'
}

function seniorityFromStage(stage: string): 'senior' | 'mid' | 'entry' {
  if (stage === 'college' || stage === 'recent') return 'entry'
  if (stage === 'working' || stage === 'changing') return 'mid'
  if (stage === 'returning') return 'entry'
  return 'mid'
}

// ── Main scoring function ─────────────────────────────────────────────────────

export function scoreJob(job: Job, ctx: ScoringContext): number {
  let score = 0

  // ── 1. Field affinity (0–20) ────────────────────────────────────────────
  // Does the job description mention the user's field keywords?
  const fieldKeywords = FIELD_TAGS[ctx.careerField] ?? []
  const jobText = (job.title + ' ' + job.description).toLowerCase()
  const fieldHits = fieldKeywords.filter(kw => jobText.includes(kw.toLowerCase())).length
  score += Math.min(20, fieldHits * 4)

  // ── 2. Keyword overlap (0–45) ───────────────────────────────────────────
  // Jaccard-like: unique words from user text that appear in job text
  const userTokens = new Set(tokenize(ctx.resumeText + ' ' + ctx.aboutMe))
  const jobTokens  = new Set(tokenize(jobText))

  if (userTokens.size > 0 && jobTokens.size > 0) {
    let hits = 0
    for (const w of jobTokens) {
      if (userTokens.has(w)) hits++
    }
    // Normalize: hits / sqrt(jobTokens.size) gives a cleaner scale
    const raw = hits / Math.sqrt(jobTokens.size)
    score += Math.min(45, Math.round(raw * 8))
  }

  // ── 3. Pay fit (0–15) ───────────────────────────────────────────────────
  const targetAnnual = parsePayToAnnual(ctx.payTarget)
  if (targetAnnual && job.payNum > 0) {
    const jobAnnual = job.payNum > 1000 ? job.payNum : job.payNum * 1000
    const ratio     = jobAnnual / targetAnnual
    if (ratio >= 0.9 && ratio <= 1.4)      score += 15  // sweet spot
    else if (ratio >= 0.75 && ratio < 0.9) score += 8   // slightly below target
    else if (ratio > 1.4)                  score += 10  // above target (may be stretch)
    // below 0.75 = no bonus (pay miss)
  } else {
    score += 8 // no data — neutral
  }

  // ── 4. Seniority fit (0–10) ────────────────────────────────────────────
  const jobSeniority  = seniorityOfTitle(job.title)
  const userSeniority = seniorityFromStage(ctx.careerStage)
  if (jobSeniority === userSeniority) score += 10
  else if (
    (jobSeniority === 'mid'   && userSeniority === 'entry') ||
    (jobSeniority === 'entry' && userSeniority === 'mid')
  ) score += 5
  // senior role for entry user = 0 bonus (mismatch)

  // ── 5. Location match (0–5) ─────────────────────────────────────────────
  if (ctx.locations.length === 0) {
    score += 3 // no preference = neutral
  } else {
    const jobLoc    = job.location.toLowerCase()
    const wantsRemote = ctx.locations.some(l => l.toLowerCase().includes('remote'))
    const geoMatch  = ctx.locations.some(l => jobLoc.includes(l.toLowerCase()))
    if (job.type === 'Remote' && wantsRemote) score += 5
    else if (geoMatch)                         score += 5
    else if (job.type === 'Remote')            score += 2 // remote available, didn't ask for it
  }

  // ── Clamp to 42–95 ──────────────────────────────────────────────────────
  // Avoid 0 (demoralizing) and 100 (unbelievable). Realistic spread.
  return Math.min(95, Math.max(42, score))
}
