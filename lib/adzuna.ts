// fitted. — Adzuna API client
// Handles fetching, field→category mapping, and normalizing responses
// to the Job shape used throughout the app.

import type { Job } from './jobs'

const APP_ID  = process.env.ADZUNA_APP_ID
const APP_KEY = process.env.ADZUNA_APP_KEY

const BASE = 'https://api.adzuna.com/v1/api/jobs'

// Adzuna category tags per fitted. career_field
const FIELD_TO_CATEGORY: Record<string, string> = {
  marketing:   'marketing-jobs',
  business:    'sales-jobs',
  tech:        'it-jobs',
  creative:    'creative-design-jobs',
  healthcare:  'healthcare-nursing-jobs',
  legal:       'legal-jobs',
  engineering: 'engineering-jobs',
  finance:     'accounting-finance-jobs',
  hr:          'human-resources-jobs',
  nonprofit:   'charity-voluntary-jobs',
}

// Keyword tags per field — used for scoring and feed display
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

// Logo generation — deterministic color from company name
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

// Parse Adzuna salary fields to a human-readable pay string + numeric value
function parseSalary(min?: number, max?: number): { pay: string; payNum: number } {
  if (!min && !max) return { pay: 'Salary not listed', payNum: 0 }
  const lo = min ? Math.round(min / 1000) : null
  const hi = max ? Math.round(max / 1000) : null
  if (lo && hi) return { pay: `$${lo}–${hi}k/yr`, payNum: Math.round((min! + max!) / 2) }
  if (hi)       return { pay: `Up to $${hi}k/yr`, payNum: max! }
  return { pay: `From $${lo}k/yr`, payNum: min! }
}

// Convert "2026-04-01T00:00:00Z" → "Apr 1, 2026"
function formatPosted(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
  } catch {
    return 'Recently'
  }
}

function isNew(iso: string): boolean {
  try {
    return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function contractToType(contract?: string, location?: string): Job['type'] {
  if (location?.toLowerCase().includes('remote')) return 'Remote'
  if (contract === 'contract_part_time') return 'Hybrid'
  return 'Hybrid' // Adzuna doesn't reliably expose remote vs. on-site; default Hybrid
}

export interface AdzunaResult {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string; area?: string[] }
  description: string
  salary_min?: number
  salary_max?: number
  created: string
  redirect_url: string
  contract_type?: string
  category: { label: string; tag: string }
}

export function normalizeJob(r: AdzunaResult, field: string): Job {
  const { pay, payNum } = parseSalary(r.salary_min, r.salary_max)
  const tags = FIELD_TAGS[field] ?? []
  const desc = r.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  // Extract keywords present in the description as display tags
  const foundTags = tags.filter(t => desc.toLowerCase().includes(t.toLowerCase()))
  const titleTags = r.title.toLowerCase().split(/\W+/).filter(w => w.length > 3).slice(0, 3)
  const displayTags = [...new Set([...foundTags, ...titleTags])].slice(0, 8)

  const locationStr = r.location.display_name || (r.location.area?.slice(-2).join(', ') ?? 'US')

  return {
    id:          `az-${r.id}`,
    title:       r.title,
    company:     r.company.display_name,
    location:    locationStr,
    type:        contractToType(r.contract_type, locationStr),
    pay,
    payNum,
    match:       0, // filled by score() in the API route
    tags:        displayTags,
    posted:      formatPosted(r.created),
    isNew:       isNew(r.created),
    url:         r.redirect_url,
    description: desc.substring(0, 1200),
    skills:      displayTags.slice(0, 5).map(name => ({ name })),
    ...logoFromCompany(r.company.display_name),
  }
}

export interface FetchJobsOptions {
  field:    string
  country?: string
  what?:    string   // keyword search
  where?:   string   // location
  page?:    number
  perPage?: number
}

export async function fetchAdzunaJobs(opts: FetchJobsOptions): Promise<Job[]> {
  if (!APP_ID || !APP_KEY) return []

  const { field, country = 'us', what, where, page = 1, perPage = 20 } = opts
  const category = FIELD_TO_CATEGORY[field] ?? FIELD_TO_CATEGORY.tech

  const params = new URLSearchParams({
    app_id:             APP_ID,
    app_key:            APP_KEY,
    results_per_page:   String(perPage),
    category,
    content_type:       'application/json',
    sort_by:            'date',
  })
  if (what)  params.set('what', what)
  if (where) params.set('where', where)

  const url = `${BASE}/${country}/search/${page}?${params}`

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) {
      console.error(`[Adzuna] HTTP ${res.status} for field=${field}`)
      return []
    }
    const data = await res.json()
    const results: AdzunaResult[] = data.results ?? []
    return results.map(r => normalizeJob(r, field))
  } catch (err) {
    console.error('[Adzuna] fetch error:', err)
    return []
  }
}
