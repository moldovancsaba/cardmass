/**
 * WHAT: SSO Logout Endpoint - End Session
 * WHY: Revoke tokens, destroy session, redirect to SSO logout
 * PATTERN: POST /api/auth/sso/logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSSOSession, destroySSOSession } from '@/lib/sso/session';
import { revokeRefreshToken, buildLogoutUrl } from '@/lib/sso/client';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // WHAT: Get session ID from cookie
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sso_session')?.value;

    if (sessionId) {
      // WHAT: Load session from MongoDB
      const session = await getSSOSession(sessionId);

      if (session) {
        // WHAT: Revoke refresh token at SSO level
        // WHY: Invalidate token so it can't be used to get new access tokens
        try {
          await revokeRefreshToken(session.refreshToken);
        } catch (error) {
          // WHAT: Revocation failed (token already invalid, network error, etc.)
          // WHY: Continue with local session cleanup anyway
          console.warn('[SSO Logout] Token revocation failed:', error);
        }

        // WHAT: Destroy session in MongoDB
        await destroySSOSession(sessionId);
      }

      // WHAT: Delete session cookie
      cookieStore.delete('sso_session');
    }

    // WHAT: Determine post-logout redirect URI
    // WHY: Where to send user after SSO logout completes
    const baseUrl =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      'localhost:6000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const postLogoutRedirectUri = `${protocol}://${baseUrl}/login`;

    // WHAT: Build SSO logout URL
    // WHY: Clear SSO cookie and redirect user back to app
    const logoutUrl = buildLogoutUrl(postLogoutRedirectUri);

    // WHAT: Redirect to SSO logout endpoint
    return NextResponse.redirect(logoutUrl);
  } catch (error) {
    console.error('[SSO Logout] Error:', error);
    // WHAT: Even if logout fails, clear local session and redirect to login
    const cookieStore = await cookies();
    cookieStore.delete('sso_session');
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
