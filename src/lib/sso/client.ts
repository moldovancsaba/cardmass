/**
 * WHAT: SSO OAuth2/OIDC Client Library
 * WHY: Provides reusable OAuth2 helper functions for SSO integration
 * DEPENDENCIES: jose for JWT verification
 */

import * as jose from 'jose';
import { createRemoteJWKSet } from 'jose';

// WHAT: SSO configuration from environment variables
// WHY: Centralize config to avoid repetition and allow easy updates
const SSO_BASE_URL = process.env.SSO_BASE_URL || 'https://sso.doneisbetter.com';
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID || '';
const SSO_CLIENT_SECRET = process.env.SSO_CLIENT_SECRET || '';
const SSO_REDIRECT_URI = process.env.SSO_REDIRECT_URI || '';

/**
 * WHAT: Validate SSO configuration at module load
 * WHY: Fail fast with clear error messages if configuration is missing
 */
function validateSSOConfig() {
  const errors: string[] = [];
  
  if (!SSO_CLIENT_ID || SSO_CLIENT_ID.trim() === '') {
    errors.push('SSO_CLIENT_ID is required but not set. Add it to .env.local or Vercel environment variables.');
  }
  
  if (!SSO_CLIENT_SECRET || SSO_CLIENT_SECRET.trim() === '') {
    errors.push('SSO_CLIENT_SECRET is required but not set. Add it to .env.local or Vercel environment variables.');
  }
  
  if (!SSO_REDIRECT_URI || SSO_REDIRECT_URI.trim() === '') {
    errors.push('SSO_REDIRECT_URI is required but not set. Add it to .env.local or Vercel environment variables.');
  }
  
  if (errors.length > 0) {
    throw new Error(
      `SSO Configuration Error:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Run 'npm run sso:validate' to check your configuration.`
    );
  }
}

// WHAT: Validate configuration when module loads (only in Node.js runtime)
// WHY: Catch configuration errors early, before OAuth flow starts
if (typeof window === 'undefined') {
  try {
    validateSSOConfig();
  } catch (error) {
    // WHAT: Log error but don't throw in module scope
    // WHY: Allow app to start; errors will be caught when SSO functions are called
    console.error('[SSO Config]', error instanceof Error ? error.message : String(error));
  }
}

// WHAT: JWKS endpoint for RS256 JWT verification
// WHY: SSO signs tokens with RS256, need public keys to verify
const JWKS_URI = `${SSO_BASE_URL}/.well-known/jwks.json`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URI));

// ============================================================================
// Types
// ============================================================================

export interface PKCEPair {
  verifier: string;
  challenge: string;
}

export interface OAuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
  scope: string;
}

export interface IdTokenPayload {
  sub: string;           // User ID (UUID)
  name: string;          // Full name
  email: string;         // Email address
  email_verified: boolean;
  picture?: string;      // Profile picture URL
  iat: number;          // Issued at
  exp: number;          // Expires at
  iss: string;          // Issuer
  aud: string;          // Audience (client ID)
}

export interface OAuthState {
  csrf: string;          // CSRF token
  return_to?: string;    // Return URL after OAuth
  timestamp: number;     // State creation timestamp
}

// ============================================================================
// PKCE Generation
// ============================================================================

/**
 * WHAT: Generate PKCE code verifier (43-128 chars, base64url)
 * WHY: PKCE prevents authorization code interception attacks
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * WHAT: Generate PKCE code challenge (SHA-256 hash of verifier)
 * WHY: Challenge is sent in auth request, verifier in token exchange
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * WHAT: Generate complete PKCE pair (verifier + challenge)
 * WHY: Convenience function for OAuth flow
 */
export async function generatePKCE(): Promise<PKCEPair> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  return { verifier, challenge };
}

/**
 * WHAT: Base64URL encode buffer
 * WHY: OAuth specs require base64url encoding (no padding, URL-safe)
 */
function base64URLEncode(buffer: Uint8Array): string {
  const bytes = Array.from(buffer);
  const base64 = Buffer.from(bytes).toString('base64');
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ============================================================================
// State Management
// ============================================================================

/**
 * WHAT: Generate OAuth state parameter with CSRF + return URL
 * WHY: Prevent CSRF attacks and preserve user's original page
 */
export function generateOAuthState(returnTo?: string): string {
  const csrf = generateCodeVerifier(); // Reuse PKCE logic for random string
  const state: OAuthState = {
    csrf,
    return_to: returnTo,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

/**
 * WHAT: Parse and validate OAuth state parameter
 * WHY: Verify CSRF token and extract return URL
 */
export function parseOAuthState(encodedState: string): OAuthState | null {
  try {
    const json = Buffer.from(encodedState, 'base64url').toString('utf-8');
    const state = JSON.parse(json) as OAuthState;
    
    // WHAT: Validate state structure
    if (!state.csrf || typeof state.csrf !== 'string') {
      return null;
    }
    
    // WHAT: Check state age (10 minutes max)
    // WHY: Prevent replay attacks
    if (state.timestamp) {
      const age = Date.now() - state.timestamp;
      if (age > 10 * 60 * 1000) {
        return null;
      }
    }
    
    return state;
  } catch {
    return null;
  }
}

/**
 * WHAT: Validate return URL to prevent open redirect attacks
 * WHY: Malicious actors could craft state with external URLs
 */
export function isValidReturnUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('/')) return false;
  if (url.startsWith('//')) return false; // Protocol-relative URLs are dangerous
  if (url.includes('<') || url.includes('>')) return false; // XSS attempt
  return true;
}

// ============================================================================
// Authorization URL
// ============================================================================

/**
 * WHAT: Build OAuth authorization URL
 * WHY: Redirect user to SSO login page
 */
export function buildAuthorizeUrl(params: {
  codeChallenge: string;
  state: string;
  prompt?: 'login' | 'none';
}): string {
  // WHAT: Validate configuration before building URL
  // WHY: Provide clear error if SSO is not configured
  if (!SSO_CLIENT_ID || !SSO_REDIRECT_URI) {
    throw new Error(
      'SSO not configured: SSO_CLIENT_ID and SSO_REDIRECT_URI are required. ' +
      'Check your .env.local or Vercel environment variables.'
    );
  }
  
  const searchParams = new URLSearchParams({
    response_type: 'code',
    client_id: SSO_CLIENT_ID,
    redirect_uri: SSO_REDIRECT_URI,
    scope: 'openid profile email offline_access',
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: 'S256',
  });
  
  if (params.prompt) {
    searchParams.set('prompt', params.prompt);
  }
  
  return `${SSO_BASE_URL}/api/oauth/authorize?${searchParams.toString()}`;
}

// ============================================================================
// Token Exchange
// ============================================================================

/**
 * WHAT: Exchange authorization code for tokens
 * WHY: Complete OAuth flow after user authorizes
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<OAuthTokens> {
  // WHAT: Validate configuration before token exchange
  // WHY: Provide clear error if SSO is not configured
  if (!SSO_CLIENT_ID || !SSO_CLIENT_SECRET || !SSO_REDIRECT_URI) {
    throw new Error(
      'SSO not configured: SSO_CLIENT_ID, SSO_CLIENT_SECRET, and SSO_REDIRECT_URI are required. ' +
      'Check your .env.local or Vercel environment variables.'
    );
  }
  
  const response = await fetch(`${SSO_BASE_URL}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SSO_REDIRECT_URI,
      client_id: SSO_CLIENT_ID,
      client_secret: SSO_CLIENT_SECRET,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Token exchange failed: ${error.error_description || response.statusText}`
    );
  }

  return await response.json();
}

// ============================================================================
// ID Token Parsing
// ============================================================================

/**
 * WHAT: Parse and verify ID token JWT
 * WHY: Extract user info and verify signature with SSO public keys
 */
export async function parseIdToken(idToken: string): Promise<IdTokenPayload> {
  try {
    // WHAT: Verify JWT signature and decode payload
    // WHY: Ensures token was issued by SSO and not tampered with
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: SSO_BASE_URL,
      audience: SSO_CLIENT_ID,
    });

    // WHAT: Extract and validate required ID token fields
    // WHY: JWTPayload is a generic type; need to validate structure
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      throw new Error('Invalid ID token payload structure');
    }

    return {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      email_verified: payload.email_verified === true,
      picture: typeof payload.picture === 'string' ? payload.picture : undefined,
      iat: typeof payload.iat === 'number' ? payload.iat : 0,
      exp: typeof payload.exp === 'number' ? payload.exp : 0,
      iss: typeof payload.iss === 'string' ? payload.iss : '',
      aud: typeof payload.aud === 'string' ? payload.aud : '',
    };
  } catch (error) {
    throw new Error(`ID token verification failed: ${error}`);
  }
}

/**
 * WHAT: Parse ID token without verification (unsafe, for debugging only)
 * WHY: Quickly extract user info without async JWKS fetch
 * WARNING: Never use in production auth checks - always verify tokens!
 */
export function parseIdTokenUnsafe(idToken: string): IdTokenPayload {
  const [, payload] = idToken.split('.');
  const decoded = Buffer.from(payload, 'base64').toString('utf-8');
  return JSON.parse(decoded) as IdTokenPayload;
}

// ============================================================================
// Token Refresh
// ============================================================================

/**
 * WHAT: Refresh access token using refresh token
 * WHY: Access tokens expire after 1 hour; refresh extends session
 * NOTE: Refresh tokens are rotated (old token invalidated)
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<OAuthTokens> {
  const response = await fetch(`${SSO_BASE_URL}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SSO_CLIENT_ID,
      client_secret: SSO_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error('Refresh token expired or revoked');
  }

  return await response.json();
}

// ============================================================================
// Token Revocation
// ============================================================================

/**
 * WHAT: Revoke refresh token (logout)
 * WHY: Invalidate user's session at SSO level
 */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await fetch(`${SSO_BASE_URL}/api/oauth/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: refreshToken,
      token_type_hint: 'refresh_token',
      client_id: SSO_CLIENT_ID,
      client_secret: SSO_CLIENT_SECRET,
    }),
  });
}

// ============================================================================
// Logout URL
// ============================================================================

/**
 * WHAT: Build SSO logout URL with post-logout redirect
 * WHY: Clear SSO cookie and redirect user back to app
 */
export function buildLogoutUrl(postLogoutRedirectUri: string): string {
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
  });
  return `${SSO_BASE_URL}/api/oauth/logout?${params.toString()}`;
}

// ============================================================================
// Token Validation
// ============================================================================

/**
 * WHAT: Validate access token (JWT verification)
 * WHY: Verify token is valid and not expired
 */
export async function validateAccessToken(
  accessToken: string
): Promise<boolean> {
  try {
    await jose.jwtVerify(accessToken, JWKS, {
      issuer: SSO_BASE_URL,
      audience: SSO_CLIENT_ID,
    });
    return true;
  } catch {
    return false;
  }
}
