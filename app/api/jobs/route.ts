import { NextRequest, NextResponse } from 'next/server'
import { fetchAdzunaJobs } from '../../../lib/adzuna'
import { scoreJob, ScoringContext } from '../../../lib/score'
import { getAllJobs, getJobsForField } from '../../../lib/jobs'
import type { Job } from '../../../lib/jobs'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CACHE_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

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

async function readCache(field: string, country: string): Promise<Job[] | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/job_cache?field=eq.${encodeURIComponent(field)}&country=eq.${encodeURIComponent(country)}&select=jobs_json,fetched_at`,
    { headers: { 'apikey': SUPABASE_SERVICE, 'Authorization': `Bearer ${SUPABASE_SERVICE}` } }
  )
  if (!res.ok) return null
  const rows = await res.json()
  if (!rows.length) return null

  const { jobs_json, fetched_at } = rows[0]
  const age = Date.now() - new Date(fetched_at).getTime()
  if (age > CACHE_TTL_MS) return null // stale

  return jobs_json as Job[]
}

async function writeCache(field: string, country: string, jobs: Job[]): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/job_cache`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ field, country, jobs_json: jobs, fetched_at: new Date().toISOString() }),
  })
}

// ── GET /api/jobs ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await getUserFromCookie(request)
  if (!user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const token   = request.cookies.get('fitted-token')!.value
  const profile = await getProfile(token, user.id)
  const field   = profile?.career_field ?? 'tech'
  const country = 'us'

  // Build scoring context (resume text fetched in parallel with cache check)
  const [resumeText, cached] = await Promise.all([
    getActiveResumeText(token, user.id),
    readCache(field, country),
  ])

  const ctx: ScoringContext = {
    resumeText,
    aboutMe:     profile?.about_me     ?? '',
    careerField: profile?.career_field ?? '',
    careerStage: profile?.career_stage ?? 'recent',
    payTarget:   profile?.pay_target   ?? '',
    locations:   profile?.locations    ?? [],
  }

  let jobs: Job[]

  if (cached) {
    // Cache hit — score the cached jobs against this user's current profile
    jobs = cached.map(j => ({ ...j, match: scoreJob(j, ctx) }))
    console.log(`[Jobs] cache hit field=${field} count=${jobs.length}`)
  } else {
    // Cache miss — fetch from Adzuna
    const whereQuery = ctx.locations.find(l => !l.toLowerCase().includes('remote')) ?? ''
    const fresh = await fetchAdzunaJobs({ field, country, where: whereQuery, perPage: 24 })

    if (fresh.length > 0) {
      // Store unscored jobs in cache (scores are user-specific, not cached)
      await writeCache(field, country, fresh)
      jobs = fresh.map(j => ({ ...j, match: scoreJob(j, ctx) }))
      console.log(`[Jobs] Adzuna fetch field=${field} count=${jobs.length}`)
    } else {
      // Fallback to static jobs — Adzuna key missing or API error
      const staticJobs = field ? getJobsForField(field) : getAllJobs()
      jobs = staticJobs.map(j => ({ ...j, match: scoreJob(j, ctx) }))
      console.log(`[Jobs] fallback to static field=${field} count=${jobs.length}`)
    }
  }

  // Sort by match score descending
  jobs.sort((a, b) => b.match - a.match)

  return NextResponse.json({ jobs, field, source: cached ? 'cache' : 'fresh' })
}
