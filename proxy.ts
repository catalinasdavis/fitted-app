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

  // Only act on the root path. All other paths (including /auth, /api/*, and
  // static assets) must pass through untouched — Next.js 16 matcher patterns
  // are prefix-anchored, so without this guard every path would be caught.
  if (pathname === '/') {
    if (token) {
      // Authenticated users go to the app.
      return NextResponse.redirect(new URL('/home', request.url))
    }
    if (new Date() < LAUNCH_DATE) {
      // Pre-launch gate: unauthenticated visitors see the coming-soon page.
      // No-cache headers prevent Vercel's edge and browsers from serving a
      // stale cached response after the proxy logic or cookie state changes.
      const res = NextResponse.redirect(new URL('/coming-soon.html', request.url))
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.headers.set('Pragma', 'no-cache')
      res.headers.set('Expires', '0')
      return res
    }
    // Post-launch: serve app/page.tsx (the landing page).
    return NextResponse.next()
  }

  // FOUNDER BYPASS — delete this block after launch
  if (pathname === FOUNDER_PREVIEW_PATH) {
    return NextResponse.redirect(new URL('/landing.html', request.url))
  }

  // Everything else passes through.
  return NextResponse.next()
}

export const config = {
  // Regex that matches only the exact root '/' and '/founder-preview'.
  // Using (.*) would prefix-match all paths — avoid that pattern at '/'.
  matcher: ['/', '/founder-preview'],
}
