// fitted. — Active Jobs DB client (Fantastic.jobs via RapidAPI)
// Replaces lib/adzuna.ts. Drop-in compatible: same Job shape, same FIELD_TAGS export.
//
// API: https://active-jobs-db.p.rapidapi.com
// Endpoints:
//   /active-ats-1h  — jobs indexed in the last hour  (low volume, real-time)
//   /active-ats-24h — jobs indexed in the last 24 h  (default — good volume + freshness)
//   /active-ats-7d  — jobs indexed in the last 7 d   (largest pool, good for cold starts)
//
// Free-tier note: RapidAPI free tier limits vary by API. We cache results in Supabase
// for 24 hours (CACHE_TTL_MS in the API route), so live fetches happen at most once
// per field per day. Never call fetchFantasticJobs on every request — only on cache miss.

import type { Job } from './jobs'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const API_HOST     = 'active-jobs-db.p.rapidapi.com'
const BASE         = `https://${API_HOST}`

// ── Field → title search keyword ─────────────────────────────────────────────
// The API filters by job title keyword. One representative term per field.
const FIELD_TO_KEYWORD: Record<string, string> = {
  marketing:   'marketing',
  business:    'sales',
  tech:        'software',
  creative:    'designer',
  healthcare:  'healthcare',
  legal:       'legal',
  engineering: 'engineer',
  finance:     'finance',
  hr:          'human resources',
  nonprofit:   'program manager',
}

// ── Title-level field relevance check ────────────────────────────────────────
// Each field has an extended set of title keywords. Jobs where the title
// contains NONE of these are discarded as clearly off-field.
// Kept permissive — only removes obvious outliers (e.g. "Nurse" in a tech search).
const FIELD_TITLE_KW: Record<string, string[]> = {
  marketing:   ['marketing','brand','content','seo','comms','communications','growth','pr ','copywriter','campaign','social','email','demand gen'],
  business:    ['sales','business development','account','revenue','partnership','commercial','customer success','bdr','sdr','quota'],
  tech:        ['software','engineer','developer','data','devops','cloud','product','fullstack','full-stack','frontend','backend','machine learning','ml ','ai ','architect','security','platform','infrastructure','site reliability','sre','ios','android'],
  creative:    ['design','designer','ux','ui','creative','art director','graphic','motion','illustrat','visual','figma'],
  healthcare:  ['healthcare','nurse','nursing','medical','clinical','health','pharma','patient','physician','therapist','care','dental','optom'],
  legal:       ['legal','attorney','lawyer','counsel','compliance','paralegal','contract','regulatory','litigation'],
  engineering: ['engineer','engineering','civil','mechanical','structural','electrical','chemical','manufacturing','cad','autocad','field engineer'],
  finance:     ['finance','financial','accounting','accountant','analyst','audit','investment','treasury','cfo','controller','cpa','actuari'],
  hr:          ['human resources','recruiting','recruiter','talent','people ops','hris','onboarding','compensation','hr ','hr,','chro'],
  nonprofit:   ['program','nonprofit','ngo','community','outreach','development','grants','advocacy','education','philanthropy'],
}

function titleRelevantToField(title: string, field: string): boolean {
  const kws = FIELD_TITLE_KW[field]
  if (!kws) return true   // unknown field — let it through
  const t = title.toLowerCase()
  return kws.some(kw => t.includes(kw))
}

// ── Field tags — exported so score.ts and static-jobs.ts can import them ─────
// Mirrors the old adzuna.ts FIELD_TAGS export exactly (no breaking changes).
export const FIELD_TAGS: Record<string, string[]> = {
  marketing:   ['marketing','brand','campaign','content','social media','copywriting','SEO','comms'],
  business:    ['sales','business development','partnerships','account','CRM','pipeline','revenue'],
  tech:        ['software','engineering','developer','data','SQL','Python','cloud','DevOps','product'],
  creative:    ['design','Figma','UX','UI','creative','illustration','typography','motion'],
  healthcare:  ['healthcare','clinical','nursing','patient','HIPAA','medical','research','pharma'],
  legal:       ['legal','compliance','policy','regulatory','contract','Westlaw','paralegal'],
  engineering: ['engineering','AutoCAD','Revit','structural','civil','mechanical','architecture'],
  finance:     ['finance','accounting','FP&A','GAAP','Excel','modeling','audit','investment'],
  hr:          ['HR','recruiting','talent','onboarding','HRIS','Workday','Greenhouse','people ops'],
  nonprofit:   ['nonprofit','education','program','grants','community','outreach','advocacy'],
}

// ── Raw API response shape ────────────────────────────────────────────────────
// Based on confirmed live response from /active-ats-24h.
// Fields marked optional (?) may be null on free tier or for some ATS providers.
export interface ActiveJobsResult {
  id:                      string
  title:                   string | null
  organization:            string | null
  organization_url:        string | null
  organization_logo:       string | null
  date_posted:             string | null   // ISO datetime
  date_created:            string          // ISO datetime — always present
  date_validthrough:       string | null
  url:                     string
  source:                  string          // ATS platform name e.g. 'pageup', 'greenhouse'
  source_type:             string          // 'ats' | 'career-site'
  source_domain:           string
  locations_raw:           Array<{
    '@type': string
    address?: {
      '@type': string
      addressLocality?: string
      addressRegion?:   string
      addressCountry?:  string
    }
  }> | null
  locations_alt_raw:       string[] | null
  locations_derived:       string[] | null  // e.g. ['New York, NY, United States']
  location_type:           string | null    // 'TELECOMMUTE' for remote jobs
  location_requirements_raw: unknown | null
  salary_raw:              SalaryRaw | null
  employment_type:         string[] | null  // e.g. ['FULL_TIME']
  cities_derived:          string[] | null
  counties_derived:        string[] | null
  regions_derived:         string[] | null
  countries_derived:       string[] | null
  timezones_derived:       string[] | null
  lats_derived:            number[] | null
  lngs_derived:            number[] | null
  remote_derived:          boolean
  domain_derived:          string | null
  // Present on paid tiers / AI-enriched plans:
  description_text?:       string
  description_html?:       string
  ai_key_skills?:          string[]
  ai_work_arrangement?:    string
  ai_salary_minvalue?:     number
  ai_salary_maxvalue?:     number
  ai_salary_value?:        number
  ai_salary_unittext?:     string
}

// Google Jobs / Schema.org MonetaryAmount
interface SalaryRaw {
  '@type'?:  string
  currency?: string
  value?: {
    value?:    number
    minValue?: number
    maxValue?: number
    unitText?: string   // 'YEAR' | 'MONTH' | 'HOUR'
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function logoFromCompany(company: string): Pick<Job, 'logo' | 'logoBg' | 'logoColor'> {
  const initials = company
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?'

  const palettes: [string, string][] = [
    ['#eaeffe', '#2d5be3'],
    ['#e6f5ed', '#1a501a'],
    ['#fdf3e3', '#b8750a'],
    ['#f4f2ed', '#3d3d45'],
    ['#fdecea', '#a32d2d'],
    ['#f0e8fe', '#6d28d9'],
    ['#e8f4fd', '#185fa5'],
    ['#fef3f0', '#e85d3a'],
  ]
  const idx = company.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % palettes.length
  const [logoBg, logoColor] = palettes[idx]
  return { logo: initials, logoBg, logoColor }
}

function formatPosted(iso: string | null): string {
  if (!iso) return 'Recently'
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
  } catch {
    return 'Recently'
  }
}

function isNew(iso: string | null): boolean {
  if (!iso) return false
  try { return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000 }
  catch { return false }
}

// Parse Google Jobs salary schema → human string + numeric annual value
function parseSalary(raw: SalaryRaw | null, aiMin?: number, aiMax?: number, aiVal?: number, aiUnit?: string): { pay: string; payNum: number } {
  // Prefer AI-enriched salary fields when present (more reliable)
  const unit = (raw?.value?.unitText ?? aiUnit ?? 'YEAR').toUpperCase()
  const hourly = unit === 'HOUR'
  const toK    = (n: number) => Math.round(n / 1000)

  const minV = raw?.value?.minValue ?? aiMin
  const maxV = raw?.value?.maxValue ?? aiMax
  const val  = raw?.value?.value    ?? aiVal

  if (minV && maxV) {
    if (hourly) return { pay: `$${minV}–${maxV}/hr`,         payNum: Math.round((minV + maxV) / 2) * 2080 }
    return       { pay: `$${toK(minV)}–${toK(maxV)}k/yr`,   payNum: Math.round((minV + maxV) / 2) }
  }
  if (val) {
    if (hourly) return { pay: `$${val}/hr`,                  payNum: val * 2080 }
    return       { pay: `$${toK(val)}k/yr`,                  payNum: val }
  }
  return { pay: 'Salary not listed', payNum: 0 }
}

function toJobType(r: ActiveJobsResult): Job['type'] {
  if (r.remote_derived || r.location_type === 'TELECOMMUTE') return 'Remote'
  if (r.ai_work_arrangement) {
    const w = r.ai_work_arrangement.toLowerCase()
    if (w.includes('remote')) return 'Remote'
    if (w.includes('hybrid')) return 'Hybrid'
  }
  if (r.employment_type?.some(t => /part.time|contract/i.test(t))) return 'Hybrid'
  return 'On-site'
}

// ── Normalizer ────────────────────────────────────────────────────────────────

export function normalizeJob(r: ActiveJobsResult, field: string): Job {
  const { pay, payNum } = parseSalary(
    r.salary_raw,
    r.ai_salary_minvalue,
    r.ai_salary_maxvalue,
    r.ai_salary_value,
    r.ai_salary_unittext,
  )

  const fieldTags = FIELD_TAGS[field] ?? []
  // description_text is absent on free tier — fall back to empty string.
  // Score and tags still work; keyword scoring will rely on title + user resume.
  const desc = (r.description_text ?? '').replace(/\s+/g, ' ').trim()

  const foundTags  = fieldTags.filter(t => desc.toLowerCase().includes(t.toLowerCase()))
  const aiSkills   = r.ai_key_skills?.slice(0, 4) ?? []
  const titleWords = (r.title ?? '').toLowerCase().split(/\W+/).filter(w => w.length > 3).slice(0, 3)
  const displayTags = [...new Set([...foundTags, ...aiSkills, ...titleWords])].slice(0, 8)

  const location = r.locations_derived?.[0]
    ?? r.locations_alt_raw?.[0]
    ?? r.locations_raw?.[0]?.address?.addressLocality
    ?? 'US'

  const company = r.organization ?? 'Unknown'

  return {
    id:          `fj-${r.id}`,
    title:       r.title ?? 'Untitled',
    company,
    location,
    type:        toJobType(r),
    pay,
    payNum,
    match:       0,  // filled by scoreJob() in the API route
    tags:        displayTags,
    posted:      formatPosted(r.date_posted ?? r.date_created),
    isNew:       isNew(r.date_posted ?? r.date_created),
    url:         r.url,
    description: desc.substring(0, 1200),
    skills:      displayTags.slice(0, 5).map(name => ({ name })),
    ...logoFromCompany(company),
  }
}

// ── Fetch function ────────────────────────────────────────────────────────────

export type FetchWindow = '1h' | '24h' | '7d'

export interface FetchJobsOptions {
  field:    string
  where?:   string        // location hint (passed as query param; filtering is approximate)
  perPage?: number
  window?:  FetchWindow   // freshness window — default '24h'
}

export async function fetchFantasticJobs(opts: FetchJobsOptions): Promise<Job[]> {
  if (!RAPIDAPI_KEY) {
    console.warn('[ActiveJobsDB] RAPIDAPI_KEY not set — falling back to static jobs')
    return []
  }

  const { field, where, perPage = 24, window = '24h' } = opts
  const keyword = FIELD_TO_KEYWORD[field] ?? field

  const params = new URLSearchParams({
    title: keyword,
    limit: String(perPage),
  })
  // location filter is approximate — API is a global ATS feed, not a geo-search engine
  if (where) params.set('location', where)

  const url = `${BASE}/active-ats-${window}?${params}`

  try {
    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key':  RAPIDAPI_KEY,
        'X-RapidAPI-Host': API_HOST,
      },
      next: { revalidate: 0 },  // Next.js: opt out of built-in cache — Supabase handles caching
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[ActiveJobsDB] HTTP ${res.status} field=${field} window=${window} — ${body.substring(0, 200)}`)
      return []
    }

    const data: unknown = await res.json()

    if (!Array.isArray(data)) {
      console.error('[ActiveJobsDB] unexpected response shape — expected array, got:', typeof data)
      return []
    }

    const results = data as ActiveJobsResult[]
    const valid   = results.filter(r => r.title && r.url)
    const inField = valid.filter(r => titleRelevantToField(r.title!, field))

    console.log(`[ActiveJobsDB] field=${field} window=${window} total=${results.length} valid=${valid.length} in-field=${inField.length}`)
    return inField.map(r => normalizeJob(r, field))

  } catch (err) {
    console.error('[ActiveJobsDB] fetch error:', err)
    return []
  }
}
