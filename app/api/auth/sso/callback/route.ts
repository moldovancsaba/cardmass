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
        new URL('/?error=oauth_denied', request.url)
      );
    }

    // WHAT: Validate required parameters
    if (!code || !encodedState) {
      return NextResponse.redirect(
        new URL('/?error=invalid_callback', request.url)
      );
    }

    // WHAT: Parse and validate state parameter
    // WHY: Verify CSRF token and extract return URL
    const state = parseOAuthState(encodedState);
    if (!state) {
      console.error('[SSO Callback] Invalid state parameter');
      return NextResponse.redirect(
        new URL('/?error=invalid_state', request.url)
      );
    }

    // WHAT: Retrieve PKCE verifier from cookie
    // WHY: Need it to complete code exchange
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('sso_pkce_verifier')?.value;
    if (!codeVerifier) {
      console.error('[SSO Callback] Missing PKCE verifier');
      return NextResponse.redirect(
        new URL('/?error=missing_verifier', request.url)
      );
    }

    // WHAT: Exchange authorization code for tokens
    // WHY: Complete OAuth flow; get access/refresh/ID tokens
    console.log('[SSO Callback] Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    console.log('[SSO Callback] Token exchange successful. Has id_token:', !!tokens.id_token);

    // WHAT: Parse and verify ID token
    // WHY: Extract user info and verify JWT signature
    console.log('[SSO Callback] Parsing ID token...');
    const userInfo = await parseIdToken(tokens.id_token);
    console.log('[SSO Callback] ID token parsed. User:', userInfo.email, 'Sub:', userInfo.sub);

    // WHAT: Query SSO for app-specific permission
    // WHY: Check if user has access to CardMass and what role they have
    console.log('[SSO Callback] Querying app permission for user:', userInfo.sub, userInfo.email);
    let permission = await getAppPermission(userInfo.sub, tokens.access_token);
    console.log('[SSO Callback] Permission received:', JSON.stringify(permission, null, 2));

    // WHAT: Handle users without permission record
    // WHY: First-time users need to request access
    if (!hasAppAccess(permission)) {
      console.log('[SSO Callback] User does NOT have access. Status:', permission.status, 'Role:', permission.role);
      
      // WHAT: If no permission exists, create access request
      if (permission.status === 'none') {
        console.log('[SSO Callback] User has no access; requesting...');
        permission = await requestAppAccess(userInfo.sub, tokens.access_token);
        console.log('[SSO Callback] Access requested. New permission:', JSON.stringify(permission, null, 2));
      }

      // WHAT: Redirect based on permission status
      if (isPending(permission)) {
        console.log('[SSO Callback] Redirecting to /access-pending');
        return NextResponse.redirect(new URL('/access-pending', request.url));
      }
      if (isRevoked(permission)) {
        console.log('[SSO Callback] Redirecting to /access-revoked');
        return NextResponse.redirect(new URL('/access-revoked', request.url));
      }

      // WHAT: Other non-access statuses
      console.log('[SSO Callback] No access, redirecting to home with error');
      return NextResponse.redirect(
        new URL('/?error=no_access', request.url)
      );
    }
    
    console.log('[SSO Callback] User HAS access! Role:', permission.role);

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
    // WHAT: Enhanced error logging with full details
    // WHY: Help diagnose SSO authentication failures
    const searchParams = request.nextUrl.searchParams;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : undefined;
    
    const errorDetails = {
      message: errorMessage,
      stack: errorStack,
      name: errorName,
      code: searchParams.get('code') ? 'present' : 'missing',
      state: searchParams.get('state') ? 'present' : 'missing',
      error: searchParams.get('error'),
      url: request.url,
      timestamp: new Date().toISOString(),
    };
    
    console.error('[SSO Callback] ============================================');
    console.error('[SSO Callback] AUTHENTICATION FAILED - Full Error Details:');
    console.error('[SSO Callback] ============================================');
    console.error(JSON.stringify(errorDetails, null, 2));
    console.error('[SSO Callback] ============================================');
    
    // WHAT: Extract specific error information for user-friendly messages
    // WHY: Different errors need different handling
    let errorCode = 'auth_failed';
    if (error instanceof Error) {
      if (error.message.includes('Token exchange failed')) {
        errorCode = 'token_exchange_failed';
        console.error('[SSO Callback] ROOT CAUSE: Token exchange error');
        console.error('[SSO Callback] Check: redirect_uri, client_id, client_secret match SSO settings');
      } else if (error.message.includes('ID token verification failed')) {
        errorCode = 'token_verification_failed';
        console.error('[SSO Callback] ROOT CAUSE: ID token verification error');
        console.error('[SSO Callback] Check: JWKS endpoint accessible, token signature valid');
        console.error('[SSO Callback] Error details:', errorMessage);
      } else if (error.message.includes('SSO not configured')) {
        errorCode = 'sso_not_configured';
        console.error('[SSO Callback] ROOT CAUSE: SSO configuration missing');
        console.error('[SSO Callback] Check: SSO_CLIENT_ID, SSO_CLIENT_SECRET, SSO_REDIRECT_URI env vars');
      } else if (error.message.includes('User not found')) {
        errorCode = 'user_not_found';
        console.error('[SSO Callback] ROOT CAUSE: User lookup failed');
        console.error('[SSO Callback] Check: User exists in SSO database (users or publicUsers collection)');
      } else if (error.message.includes('Failed to get permission')) {
        errorCode = 'permission_check_failed';
        console.error('[SSO Callback] ROOT CAUSE: Permission API call failed');
        console.error('[SSO Callback] Check: SSO permissions API accessible, access token valid');
      } else {
        console.error('[SSO Callback] ROOT CAUSE: Unknown error');
        console.error('[SSO Callback] Full error:', errorMessage);
        console.error('[SSO Callback] Error type:', errorName);
      }
    }
    
    return NextResponse.redirect(
      new URL(`/?error=${errorCode}`, request.url)
    );
  }
}
