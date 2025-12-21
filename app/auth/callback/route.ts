/**
 * WHAT: OAuth Callback Alias (/auth/callback)
 * WHY: Support previously registered non-API redirect URI by redirecting to the new handler
 * NOTE: Preserves query string (code, state, error)
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.search
  return NextResponse.redirect(new URL(`/api/auth/sso/callback${qs}`, request.url))
}
