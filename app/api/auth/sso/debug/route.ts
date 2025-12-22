/**
 * WHAT: SSO Debug Endpoint
 * WHY: Diagnose SSO authentication issues
 * USAGE: GET /api/auth/sso/debug
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // WHAT: Gather diagnostic information
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      SSO_BASE_URL: process.env.SSO_BASE_URL,
      SSO_CLIENT_ID: process.env.SSO_CLIENT_ID,
      SSO_REDIRECT_URI: process.env.SSO_REDIRECT_URI,
      SSO_CLIENT_SECRET: process.env.SSO_CLIENT_SECRET ? '***SET***' : '***NOT SET***',
    },
    cookies: {
      sso_session: cookieStore.get('sso_session')?.value ? '***EXISTS***' : '***NOT SET***',
      sso_pkce_verifier: cookieStore.get('sso_pkce_verifier')?.value ? '***EXISTS***' : '***NOT SET***',
      admin_session: cookieStore.get('admin_session')?.value ? '***EXISTS***' : '***NOT SET***',
    },
    request: {
      url: request.url,
      method: request.method,
      headers: {
        host: request.headers.get('host'),
        'user-agent': request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
      },
    },
  };

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
