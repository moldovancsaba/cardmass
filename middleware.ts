import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isUUIDv4 } from '@/lib/validation'
import { ORG_HEADER } from '@/lib/http/headers'

/**
 * FUNCTIONAL: Enforce X-Organization-UUID header for org-scoped API routes
 * STRATEGIC: Defense-in-depth guard to avoid cross-tenant data access
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Match /api/v1/organizations/{orgUUID}/(boards|cards)
  const m = pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/(boards|cards)(?:\/.*)?$/)
  if (!m) return NextResponse.next()

  const orgFromPath = m[1]
  const orgFromHeader = req.headers.get(ORG_HEADER) || ''

  if (!isUUIDv4(orgFromPath)) {
    return NextResponse.json({ error: { code: 'INVALID_ORG_ID', message: 'Invalid organization UUID in path' } }, { status: 400 })
  }
  if (!isUUIDv4(orgFromHeader)) {
    return NextResponse.json({ error: { code: 'MISSING_OR_INVALID_ORG_HEADER', message: `Missing or invalid ${ORG_HEADER}` } }, { status: 400 })
  }
  if (orgFromPath !== orgFromHeader) {
    return NextResponse.json({ error: { code: 'ORG_SCOPE_MISMATCH', message: 'Organization in header does not match path' } }, { status: 400 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/v1/organizations/:path*'],
}