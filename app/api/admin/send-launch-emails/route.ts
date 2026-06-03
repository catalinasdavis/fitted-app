import { NextRequest, NextResponse } from 'next/server'

// ── Launch email blast ────────────────────────────────────────────────────────
//
// POST /api/admin/send-launch-emails
//   Sends the fitted. launch announcement to all waitlisted users who have not
//   yet received it (notified_at IS NULL). Safe to retry — each successful
//   delivery stamps notified_at, so re-running only picks up stragglers.
//
// POST /api/admin/send-launch-emails?dry_run=1
//   Returns a preview of who would be emailed and what subject they'd receive,
//   without actually sending anything or touching the database.
//
// Authentication: Authorization: Bearer <ADMIN_SECRET>
//
// Prerequisites (before first run):
//   1. Sign up at resend.com and verify getfittedcareers.com as a sending domain
//   2. Add RESEND_API_KEY=re_... to .env.local
//   3. Add ADMIN_SECRET=<any-secret-you-choose> to .env.local
//   4. Run the 20260526_waitlist_tier_notified.sql migration in Supabase

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESEND_API_KEY = process.env.RESEND_API_KEY!
const ADMIN_SECRET   = process.env.ADMIN_SECRET!
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.getfittedcareers.com'

const FROM_ADDRESS = 'fitted. <hq@getfittedcareers.com>'

const serviceHeaders = {
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type':  'application/json',
}

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  founding: {
    subject:    "You're in — Founding Member access to fitted.",
    headline:   "You're a Founding Member.",
    subhead:    "You were one of the first 100 people to join our waitlist. That means something to us — and we want you to feel it.",
    benefit:    '50% off your first month of fitted. Pro',
    promoCode:  process.env.FOUNDING_PROMO_CODE ?? 'FOUNDING50',
    ctaText:    'Claim Your Founding Member Access',
  },
  early: {
    subject:    "You're in — Early Access to fitted.",
    headline:   "Early Access is here.",
    subhead:    "You joined our waitlist early, and we haven't forgotten. Here's your exclusive early access offer.",
    benefit:    '25% off your first month of fitted. Pro',
    promoCode:  process.env.EARLY_ACCESS_PROMO_CODE ?? 'EARLYACCESS25',
    ctaText:    'Claim Your Early Access',
  },
  standard: {
    subject:    "fitted. is live — you're in.",
    headline:   "fitted. is officially live.",
    subhead:    "The career companion built for women is here. You joined our waitlist — now it's time to use it.",
    benefit:    null,
    promoCode:  null,
    ctaText:    'Get Started with fitted.',
  },
} as const

type Tier = keyof typeof TIER_CONFIG

// ── Email HTML builder ────────────────────────────────────────────────────────

function buildEmailHtml(tier: Tier): string {
  const { headline, subhead, benefit, promoCode, ctaText } = TIER_CONFIG[tier]

  const promoBlock = promoCode ? `
    <div style="margin:28px 0;padding:20px 24px;background:#f4f2ed;border-radius:10px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#7a7a85;letter-spacing:.08em;text-transform:uppercase;font-family:sans-serif;">Your exclusive offer</p>
      <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1a1a1f;font-family:sans-serif;">${benefit}</p>
      <p style="margin:10px 0 0;font-size:13px;color:#5a5a6a;font-family:sans-serif;">Use code at checkout:</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;letter-spacing:.12em;color:#2f3e5c;font-family:monospace;">${promoCode}</p>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f8f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.06);">

        <!-- Header -->
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #f0eeea;">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#1a1a1f;letter-spacing:-.01em;">fitted.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1a1a1f;line-height:1.3;">${headline}</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a5a;line-height:1.7;">${subhead}</p>

          ${promoBlock}

          <p style="margin:0 0 28px;font-size:14px;color:#5a5a6a;line-height:1.7;">
            fitted. is the career companion built for women — intelligent job matching, AI resume tailoring,
            and candid coaching that treats you like the smart adult you are.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="${APP_URL}" style="display:inline-block;padding:13px 28px;background:#2f3e5c;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;font-family:sans-serif;letter-spacing:.01em;">${ctaText} →</a>
          </td></tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #f0eeea;">
          <p style="margin:0;font-size:12px;color:#9a9aaa;line-height:1.6;">
            You're receiving this because you joined the fitted. waitlist at getfittedcareers.com.<br>
            Questions? Reply to this email — we read everything.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Resend helper ─────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`[LaunchEmail] Resend error for ${to}:`, res.status, err.substring(0, 200))
    return false
  }
  return true
}

// ── Mark notified ─────────────────────────────────────────────────────────────

async function markNotified(email: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/waitlist?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: { ...serviceHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ notified_at: new Date().toISOString() }),
  })
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('Authorization') ?? ''
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === '1'

  // Fetch all un-notified waitlist entries
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/waitlist?notified_at=is.null&select=email,tier&order=id.asc`,
    { headers: serviceHeaders }
  )
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
  }
  const rows: { email: string; tier: string | null }[] = await res.json()

  if (dryRun) {
    return NextResponse.json({
      dry_run: true,
      count: rows.length,
      preview: rows.map(r => ({
        email: r.email,
        tier:  r.tier ?? 'standard',
        subject: TIER_CONFIG[(r.tier as Tier) ?? 'standard'].subject,
      })),
    })
  }

  let sent    = 0
  let skipped = 0

  for (const row of rows) {
    const tier    = (row.tier as Tier | null) ?? 'standard'
    const config  = TIER_CONFIG[tier]
    const html    = buildEmailHtml(tier)

    const ok = await sendEmail(row.email, config.subject, html)
    if (ok) {
      await markNotified(row.email)
      sent++
      console.log(`[LaunchEmail] sent tier=${tier} to ${row.email}`)
    } else {
      skipped++
    }

    // Stay well under Resend's 10 req/s rate limit
    await new Promise(r => setTimeout(r, 120))
  }

  console.log(`[LaunchEmail] blast complete: sent=${sent} skipped=${skipped}`)
  return NextResponse.json({ success: true, sent, skipped, total: rows.length })
}
