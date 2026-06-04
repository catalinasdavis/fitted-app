import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  // Delete the cookie explicitly. Prefer .delete() over maxAge:0 — some
  // browsers process the cookie jar update before the next navigation only
  // when the deletion comes through the standard delete path.
  response.cookies.delete('fitted-token')
  return response
}
