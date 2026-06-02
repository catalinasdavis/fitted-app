import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── LAUNCH CONFIG ────────────────────────────────────────────────────────────
const LAUNCH_DATE = new Date('2026-06-14T00:00:00')

// ─── FOUNDER BYPASS ───────────────────────────────────────────────────────────
// /founder-preview is a hidden path the coming-soon form redirects the founder
// to. The proxy resolves it here to the full landing page — no API call, no DB
// write. Delete this constant and the block below after launch.
const FOUNDER_PREVIEW_PATH = '/founder-preview'
// ─────────────────────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url)
  const token = request.cookies.get('fitted-token')?.value

  // Authenticated users always go to the app.
  if (token) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // FOUNDER BYPASS — delete this block after launch
  if (pathname === FOUNDER_PREVIEW_PATH) {
    return NextResponse.redirect(new URL('/landing.html', request.url))
  }

  // Pre-launch gate: everyone else sees the coming-soon page.
  if (new Date() < LAUNCH_DATE) {
    return NextResponse.redirect(new URL('/coming-soon.html', request.url))
  }

  // Post-launch: serve the landing page.
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/founder-preview'],
}
