/**
 * WHAT: SSO Login Endpoint - Initiate OAuth2 Flow
 * WHY: Redirect user to SSO for authentication
 * PATTERN: GET /api/auth/sso/login?return_to=/settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePKCE, generateOAuthState, buildAuthorizeUrl } from '@/lib/sso/client';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // WHAT: Extract return URL from query params (optional)
    // WHY: Preserve user's original page to return after OAuth
    const searchParams = request.nextUrl.searchParams;
    const returnTo = searchParams.get('return_to') || undefined;
    const prompt = searchParams.get('prompt') as 'login' | 'none' | undefined;

    // WHAT: Generate PKCE pair for secure code exchange
    // WHY: Prevents authorization code interception attacks
    const pkce = await generatePKCE();

    // WHAT: Generate state parameter with CSRF token + return URL
    // WHY: Prevent CSRF attacks and preserve return destination
    const state = generateOAuthState(returnTo);

    // WHAT: Store PKCE verifier in httpOnly cookie
    // WHY: Need it later in callback to exchange code for tokens
    // SECURITY: httpOnly prevents XSS attacks
    const cookieStore = await cookies();
    cookieStore.set('sso_pkce_verifier', pkce.verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes (OAuth flow should complete quickly)
      path: '/',
    });

    // WHAT: Build SSO authorization URL
    // WHY: Redirect user to SSO login page
    const authorizeUrl = buildAuthorizeUrl({
      codeChallenge: pkce.challenge,
      state,
      prompt,
    });

    // WHAT: Redirect to SSO authorize endpoint
    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error('[SSO Login] Error:', error);
    return NextResponse.redirect(
      new URL('/login?error=sso_init_failed', request.url)
    );
  }
}
