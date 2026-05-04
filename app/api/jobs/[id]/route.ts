import { NextRequest, NextResponse } from 'next/server'
import { getJob, getAllJobs } from '../../../../lib/jobs'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromCookie(request)
  if (!user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params

  // 1. Try Supabase cache (covers Adzuna jobs)
  const cached = await findInCache(id)
  if (cached) {
    return NextResponse.json({ job: cached })
  }

  // 2. Try static fallback (covers demo jobs with ids like 'm1', 'b2', etc.)
  const staticJob = getJob(id)
  if (staticJob) {
    return NextResponse.json({ job: staticJob })
  }

  // 3. Linear search across all static jobs as last resort
  const all = getAllJobs()
  const found = all.find(j => j.id === id)
  if (found) {
    return NextResponse.json({ job: found })
  }

  return NextResponse.json({ error: 'Job not found' }, { status: 404 })
}
