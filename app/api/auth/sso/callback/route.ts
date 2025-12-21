/**
 * WHAT: SSO Callback Endpoint - Complete OAuth2 Flow
 * WHY: Exchange authorization code for tokens, check permissions, create session
 * PATTERN: GET /api/auth/sso/callback?code=xxx&state=yyy
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  parseIdToken,
  parseOAuthState,
  isValidReturnUrl,
} from '@/lib/sso/client';
import {
  getAppPermission,
  requestAppAccess,
  hasAppAccess,
  isPending,
  isRevoked,
} from '@/lib/sso/permissions';
import { createSSOSession } from '@/lib/sso/session';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // WHAT: Extract authorization code and state from query params
    // WHY: Returned by SSO after user authorizes
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const encodedState = searchParams.get('state');
    const error = searchParams.get('error');

    // WHAT: Handle OAuth errors (user denied access, etc.)
    if (error) {
      console.error('[SSO Callback] OAuth error:', error);
      return NextResponse.redirect(
        new URL('/login?error=oauth_denied', request.url)
      );
    }

    // WHAT: Validate required parameters
    if (!code || !encodedState) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_callback', request.url)
      );
    }

    // WHAT: Parse and validate state parameter
    // WHY: Verify CSRF token and extract return URL
    const state = parseOAuthState(encodedState);
    if (!state) {
      console.error('[SSO Callback] Invalid state parameter');
      return NextResponse.redirect(
        new URL('/login?error=invalid_state', request.url)
      );
    }

    // WHAT: Retrieve PKCE verifier from cookie
    // WHY: Need it to complete code exchange
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('sso_pkce_verifier')?.value;
    if (!codeVerifier) {
      console.error('[SSO Callback] Missing PKCE verifier');
      return NextResponse.redirect(
        new URL('/login?error=missing_verifier', request.url)
      );
    }

    // WHAT: Exchange authorization code for tokens
    // WHY: Complete OAuth flow; get access/refresh/ID tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    // WHAT: Parse and verify ID token
    // WHY: Extract user info and verify JWT signature
    const userInfo = await parseIdToken(tokens.id_token);

    // WHAT: Query SSO for app-specific permission
    // WHY: Check if user has access to CardMass and what role they have
    let permission = await getAppPermission(userInfo.sub, tokens.access_token);

    // WHAT: Handle users without permission record
    // WHY: First-time users need to request access
    if (!hasAppAccess(permission)) {
      // WHAT: If no permission exists, create access request
      if (permission.status === 'none') {
        console.log('[SSO Callback] User has no access; requesting...');
        permission = await requestAppAccess(userInfo.sub, tokens.access_token);
      }

      // WHAT: Redirect based on permission status
      if (isPending(permission)) {
        return NextResponse.redirect(new URL('/access-pending', request.url));
      }
      if (isRevoked(permission)) {
        return NextResponse.redirect(new URL('/access-revoked', request.url));
      }

      // WHAT: Other non-access statuses
      return NextResponse.redirect(
        new URL('/login?error=no_access', request.url)
      );
    }

    // WHAT: Create SSO session in MongoDB
    // WHY: Store tokens + user + permissions for subsequent requests
    const session = await createSSOSession({
      tokens,
      userInfo,
      appPermission: permission,
    });

    // WHAT: Set session cookie (httpOnly)
    // WHY: Client sends this cookie on every request for authentication
    cookieStore.set('sso_session', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // WHAT: Clean up one-time-use PKCE verifier
    cookieStore.delete('sso_pkce_verifier');

    // WHAT: Determine return URL (from state or default)
    // WHY: Send user back to page they were on before OAuth
    let returnTo = state.return_to || '/';

    // WHAT: Validate return URL to prevent open redirect attacks
    // WHY: Malicious actors could craft state with external URLs
    if (!isValidReturnUrl(returnTo)) {
      console.warn('[SSO Callback] Invalid return URL, using default:', returnTo);
      returnTo = '/';
    }

    console.log('[SSO Callback] OAuth successful, redirecting to:', returnTo);
    return NextResponse.redirect(new URL(returnTo, request.url));
  } catch (error) {
    console.error('[SSO Callback] Error:', error);
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', request.url)
    );
  }
}
