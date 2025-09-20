import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Edge-safe middleware: no Node.js APIs, only Web/Fetch APIs.
// What: Adds minimal security headers and version metadata to all dynamic responses.
// Why: Professional-grade baseline that is safe on the Edge runtime and resilient to errors.

// Scope: Exclude static assets and common public files to reduce overhead and avoid unintended caching behavior.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}

export default function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()

    // Version metadata surfaced from build-time env (configured in next.config.ts)
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0'
    res.headers.set('x-app-version', version)
    res.headers.set('x-mw', '1') // lightweight marker for diagnostics

    // Security headers (kept minimal and widely compatible)
    res.headers.set('x-frame-options', 'SAMEORIGIN')
    res.headers.set('x-content-type-options', 'nosniff')
    res.headers.set('referrer-policy', 'strict-origin-when-cross-origin')

    // Enable HSTS for production host(s) only (safe for HTTPS sites)
    const host = req.headers.get('host') || ''
    if (host === 'cardmass.doneisbetter.com' || host.endsWith('.doneisbetter.com')) {
      res.headers.set('strict-transport-security', 'max-age=63072000; includeSubDomains; preload')
    }

    // Optional: future policy headers (kept commented to avoid surprises)
    // res.headers.set('permissions-policy', 'geolocation=()')

    return res
  } catch (err) {
    // Never fail closed in middleware; log minimal error without PII and pass through.
    try { console.error('middleware error', err) } catch {}
    return NextResponse.next()
  }
}