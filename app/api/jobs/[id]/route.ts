import { NextRequest, NextResponse } from 'next/server'
import { getJob, getAllJobs } from '../../../../lib/static-jobs'
import { scoreJob, ScoringContext } from '../../../../lib/score'
import type { Job } from '../../../../lib/jobs'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getUserFromCookie(request: NextRequest) {
  const token = request.cookies.get('fitted-token')?.value
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  })
  return res.ok ? res.json() : null
}

// Scan all cached fields in job_cache and return the job with the given ID
async function findInCache(id: string): Promise<Job | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/job_cache?select=jobs_json`,
    { headers: { 'apikey': SUPABASE_SERVICE, 'Authorization': `Bearer ${SUPABASE_SERVICE}` } }
  )
  if (!res.ok) return null
  const rows = await res.json()
  for (const row of rows) {
    const jobs: Job[] = row.jobs_json ?? []
    const found = jobs.find(j => j.id === id)
    if (found) return found
  }
  return null
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromCookie(request)
  if (!user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const token = request.cookies.get('fitted-token')!.value
  const { id } = await params

  // Fetch job and user context in parallel
  const [cachedJob, profile, resumeText] = await Promise.all([
    findInCache(id),
    getProfile(token, user.id),
    getActiveResumeText(token, user.id),
  ])

  let job: Job | undefined = cachedJob ?? getJob(id) ?? getAllJobs().find(j => j.id === id)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const ctx: ScoringContext = {
    resumeText,
    aboutMe:     profile?.about_me     ?? '',
    careerField: profile?.career_field ?? '',
    careerStage: profile?.career_stage ?? 'working',
    payTarget:   profile?.pay_target   ?? '',
    locations:   profile?.locations    ?? [],
  }

  return NextResponse.json({ job: { ...job, match: scoreJob(job, ctx) } })
}
