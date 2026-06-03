import { NextRequest, NextResponse } from 'next/server'
import { fetchFantasticJobs } from '../../../lib/active-jobs-db'
import { scoreJob, ScoringContext } from '../../../lib/score'
import { getAllJobs, getJobsForField } from '../../../lib/static-jobs'
import type { Job } from '../../../lib/jobs'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CACHE_TTL_MS   = 7 * 24 * 60 * 60 * 1000  // 7 days — job listings stay live at least this long
const MIN_CACHE_HITS = 8                           // min jobs scoring ≥ GOOD_MATCH_MIN before cache is accepted
const GOOD_MATCH_MIN = 55                          // score floor for a job to count as a "good" match

// ── Auth helpers ─────────────────────────────────────────────────────────────

async function getUserFromCookie(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? res.json() : null
}

async function getProfile(token: string, userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=career_field,career_stage,priority,about_me,locations,pay_target`,
    { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] ?? null
}

async function getActiveResumeText(token: string, userId: string): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/resumes?user_id=eq.${userId}&is_active=eq.true&select=resume_text&limit=3`,
    { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return ''
  const rows = await res.json()
  return (rows as any[]).map((r: any) => r.resume_text ?? '').join(' ').substring(0, 4000)
}

// ── Supabase job_cache helpers ────────────────────────────────────────────────
// Cache stores normalized Job objects (match score zeroed — scores are user-specific).
// Expiry is stored in expires_at and filtered at the DB level.

async function readCache(field: string, country: string): Promise<Job[] | null> {
  const now = encodeURIComponent(new Date().toISOString())
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/job_cache?field=eq.${encodeURIComponent(field)}&country=eq.${encodeURIComponent(country)}&expires_at=gt.${now}&select=jobs_json`,
    { headers: { 'apikey': SUPABASE_SERVICE, 'Authorization': `Bearer ${SUPABASE_SERVICE}` } }
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows.length ? (rows[0].jobs_json as Job[]) : null
}

async function writeCache(field: string, country: string, jobs: Job[]): Promise<void> {
  const now = new Date()
  await fetch(`${SUPABASE_URL}/rest/v1/job_cache`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      field,
      country,
      jobs_json: jobs,
      fetched_at: now.toISOString(),
      expires_at: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
    }),
  })
}

// ── Location helpers ──────────────────────────────────────────────────────────

// Common US state abbreviations → full names. Used to expand "SF, CA" style inputs.
const STATE_ABBREVS: Record<string, string> = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
  CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia',
  HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas',
  KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts',
  MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana',
  NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico',
  NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma',
  OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
  SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont',
  VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming',
  DC:'District of Columbia',
}

// Normalize a user location string into a fully-qualified query for the API.
// "San Francisco, CA" → "San Francisco, California, United States"
// "New York"          → "New York, United States"
// "Remote"            → "" (skip)
function formatLocationQuery(raw: string): string {
  const l = raw.trim()
  if (!l || /^remote$/i.test(l)) return ''
  if (/united\s+states|u\.s\.a?\.?\s*$/i.test(l)) return l
  // Expand trailing 2-letter state abbreviation
  const abbrevMatch = l.match(/,\s*([A-Z]{2})$/)
  if (abbrevMatch) {
    const state = STATE_ABBREVS[abbrevMatch[1]]
    if (state) {
      const city = l.slice(0, l.lastIndexOf(','))
      return `${city}, ${state}, United States`
    }
  }
  return `${l}, United States`
}

// Pattern matching US state names — used to identify US jobs post-fetch.
const US_STATE_RE = /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new\s+hampshire|new\s+jersey|new\s+mexico|new\s+york|north\s+carolina|north\s+dakota|ohio|oklahoma|oregon|pennsylvania|rhode\s+island|south\s+carolina|south\s+dakota|tennessee|texas|utah|vermont|virginia|washington|west\s+virginia|wisconsin|wyoming|district\s+of\s+columbia)\b/i

function isUSJob(job: Job): boolean {
  const loc = job.location.toLowerCase()
  return loc.includes('united states') || US_STATE_RE.test(loc)
}

// ── GET /api/jobs ─────────────────────────────────────────────────────────────
// Response shape:
//   { jobs, strictMatches, broaderMatches, field, source }
//
// strictMatches — up to 10 jobs from the primary fetch, US-prioritized.
// broaderMatches — additional jobs from a second wider fetch; only present when
//                  the primary fetch returned fewer than BROADER_THRESHOLD US jobs.
//                  Deduplicated against strictMatches.
// jobs — alias for strictMatches (backwards compat).
//
// Query params:
//   ?refresh=1 — bypass cache and force a live Fantastic.jobs fetch.

const STRICT_LIMIT      = 10  // max jobs returned in the strict set
const BROADER_THRESHOLD = 8   // trigger a wider fetch when fewer than this many US jobs found

function respond(
  strictMatches: Job[],
  broaderMatches: Job[],
  field: string,
  source: string,
) {
  strictMatches.sort((a, b) => b.match - a.match)
  broaderMatches.sort((a, b) => b.match - a.match)
  return NextResponse.json({
    jobs: strictMatches,  // backwards-compat
    strictMatches,
    broaderMatches,
    field,
    source,
  })
}

// Sort a scored job array: US jobs first (within each match band), then others.
function usFirst(jobs: Job[]): Job[] {
  const us    = jobs.filter(isUSJob).sort((a, b) => b.match - a.match)
  const other = jobs.filter(j => !isUSJob(j)).sort((a, b) => b.match - a.match)
  return [...us, ...other]
}

export async function GET(request: NextRequest) {
  const user = await getUserFromCookie(request)
  if (!user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // ?refresh=1 forces a live Fantastic.jobs fetch regardless of cache state.
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1'

  const token   = request.cookies.get('fitted-token')!.value
  const profile = await getProfile(token, user.id)
  const field   = profile?.career_field ?? 'tech'
  const country = 'us'

  const [resumeText, cached] = await Promise.all([
    getActiveResumeText(token, user.id),
    forceRefresh ? Promise.resolve(null) : readCache(field, country),
  ])

  const ctx: ScoringContext = {
    resumeText,
    aboutMe:     profile?.about_me     ?? '',
    careerField: profile?.career_field ?? '',
    careerStage: profile?.career_stage ?? 'working',
    payTarget:   profile?.pay_target   ?? '',
    locations:   profile?.locations    ?? [],
  }

  // ── Cache hit — only accept if enough jobs score well for this user's profile ─
  if (cached) {
    const scored   = cached.map(j => ({ ...j, match: scoreJob(j, ctx) }))
    const goodHits = scored.filter(j => j.match >= GOOD_MATCH_MIN).length
    if (goodHits >= MIN_CACHE_HITS) {
      return respond(usFirst(scored).slice(0, STRICT_LIMIT), [], field, 'cache')
    }
    // Cache exists but too few strong matches for this profile — fall through to live fetch.
  }

  // ── Cache miss (or weak cache) — live fetch ───────────────────────────────────
  // Pick the first non-remote location and normalize it to a full location string.
  const locationInput = ctx.locations.find(l => !l.toLowerCase().includes('remote')) ?? ''
  const whereQuery    = formatLocationQuery(locationInput)

  // Pass 1: fetch 30 raw results so US filtering + field post-filter have material to work with.
  const rawFetch = await fetchFantasticJobs({ field, where: whereQuery, perPage: 30 })

  if (rawFetch.length === 0) {
    const staticJobs = field ? getJobsForField(field) : getAllJobs()
    const jobs = staticJobs.map(j => ({ ...j, match: scoreJob(j, ctx) }))
    return respond(jobs, [], field, 'static')
  }

  const allScored = rawFetch.map(j => ({ ...j, match: scoreJob(j, ctx) }))
  const usCount   = allScored.filter(isUSJob).length
  // US jobs bubble to the top; cap at STRICT_LIMIT for a clean, focused feed.
  const strictMatches = usFirst(allScored).slice(0, STRICT_LIMIT)

  let broaderUnscored: Job[] = []
  let broaderScored:   Job[] = []

  if (usCount < BROADER_THRESHOLD) {
    // Too few US jobs in the primary fetch — pull a wider 7-day set as the broader pool.
    const broader     = await fetchFantasticJobs({ field, perPage: 25, window: '7d' })
    const strictIds   = new Set(rawFetch.map(j => j.id))
    broaderUnscored   = broader.filter(j => !strictIds.has(j.id))
    const broaderAll  = broaderUnscored.map(j => ({ ...j, match: scoreJob(j, ctx) }))
    broaderScored     = usFirst(broaderAll)  // US still preferred within broader set
  }

  // Cache all unique unscored jobs — match scores are user-specific, never stored.
  const toCache = [...rawFetch, ...broaderUnscored].map(j => ({ ...j, match: 0 }))
  await writeCache(field, country, toCache)

  return respond(strictMatches, broaderScored, field, 'fantastic')
}
