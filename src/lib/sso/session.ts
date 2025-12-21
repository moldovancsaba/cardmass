/**
 * WHAT: SSO Session Management Library
 * WHY: Store and manage SSO sessions in MongoDB
 * PATTERN: Session stored with tokens + user info + app permissions
 */

import { getDb } from '@/lib/db';
import { refreshAccessToken, parseIdTokenUnsafe } from './client';
import { getAppPermission, type AppPermission } from './permissions';
import type { OAuthTokens, IdTokenPayload } from './client';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

/**
 * WHAT: SSO session document in MongoDB
 * WHY: Store complete session state with tokens + user + permissions
 */
export interface SSOSessionDoc {
  sessionId: string;           // Unique session ID (32-hex)
  userId: string;              // SSO user ID (from id_token.sub)
  email: string;               // User email
  name: string;                // User name
  emailVerified: boolean;      // Email verification status
  accessToken: string;         // OAuth access token (1 hour)
  refreshToken: string;        // OAuth refresh token (30 days, rotated)
  idToken: string;             // ID token (user info)
  appPermission: AppPermission; // CardMass app permission + role
  createdAt: Date;             // Session creation timestamp
  lastAccessedAt: Date;        // Last activity timestamp
  expiresAt: Date;             // Session expiration (30 days from creation)
  updatedAt: Date;             // Last update timestamp
}

/**
 * WHAT: Simplified session data for cookies
 * WHY: Only store session ID in cookie; full data in MongoDB
 */
export interface SessionCookie {
  sessionId: string;
}

// ============================================================================
// Session Creation
// ============================================================================

/**
 * WHAT: Create new SSO session in MongoDB
 * WHY: Store tokens + user + permissions after successful OAuth
 */
export async function createSSOSession(params: {
  tokens: OAuthTokens;
  userInfo: IdTokenPayload;
  appPermission: AppPermission;
}): Promise<SSOSessionDoc> {
  const { tokens, userInfo, appPermission } = params;

  // WHAT: Generate unique session ID
  // WHY: Cookie stores only this ID; full data in MongoDB
  const sessionId = crypto.randomBytes(32).toString('hex');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const session: SSOSessionDoc = {
    sessionId,
    userId: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name,
    emailVerified: userInfo.email_verified,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    appPermission,
    createdAt: now,
    lastAccessedAt: now,
    expiresAt,
    updatedAt: now,
  };

  const db = await getDb();
  await db.collection('ssoSessions').insertOne(session);

  return session;
}

// ============================================================================
// Session Retrieval
// ============================================================================

/**
 * WHAT: Get SSO session from MongoDB by session ID
 * WHY: Validate cookie and load user data
 */
export async function getSSOSession(
  sessionId: string
): Promise<SSOSessionDoc | null> {
  const db = await getDb();
  const session = await db.collection<SSOSessionDoc>('ssoSessions').findOne({
    sessionId,
  });

  if (!session) {
    return null;
  }

  // WHAT: Check if session expired
  // WHY: Auto-reject expired sessions
  if (session.expiresAt < new Date()) {
    await destroySSOSession(sessionId);
    return null;
  }

  // WHAT: Update last accessed timestamp
  // WHY: Track session activity; useful for analytics and security
  await db.collection('ssoSessions').updateOne(
    { sessionId },
    {
      $set: {
        lastAccessedAt: new Date(),
      },
    }
  );

  return session;
}

// ============================================================================
// Session Refresh
// ============================================================================

/**
 * WHAT: Refresh SSO session (tokens + permissions)
 * WHY: Access tokens expire after 1 hour; refresh to extend session
 */
export async function refreshSSOSession(
  sessionId: string
): Promise<SSOSessionDoc | null> {
  const session = await getSSOSession(sessionId);
  if (!session) {
    return null;
  }

  try {
    // WHAT: Refresh access token using refresh token
    // WHY: Access token expired; need new one
    const newTokens = await refreshAccessToken(session.refreshToken);

    // WHAT: Parse new ID token for updated user info
    // WHY: User info may have changed (name, email, verified status)
    const newUserInfo = parseIdTokenUnsafe(newTokens.id_token);

    // WHAT: Refresh app permission from SSO
    // WHY: Role may have changed (user → admin, revoked access, etc.)
    const newPermission = await getAppPermission(
      session.userId,
      newTokens.access_token
    );

    // WHAT: Update session with new tokens + user info + permissions
    const now = new Date();
    const db = await getDb();
    await db.collection('ssoSessions').updateOne(
      { sessionId },
      {
        $set: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token, // Rotated!
          idToken: newTokens.id_token,
          email: newUserInfo.email,
          name: newUserInfo.name,
          emailVerified: newUserInfo.email_verified,
          appPermission: newPermission,
          updatedAt: now,
          lastAccessedAt: now,
        },
      }
    );

    // WHAT: Return updated session
    return await getSSOSession(sessionId);
  } catch (error) {
    // WHAT: Refresh failed (token expired/revoked)
    // WHY: Delete invalid session; force re-authentication
    console.error('[SSO] Session refresh failed:', error);
    await destroySSOSession(sessionId);
    return null;
  }
}

// ============================================================================
// Session Destruction
// ============================================================================

/**
 * WHAT: Destroy SSO session (logout)
 * WHY: Remove session from database
 * NOTE: Caller should also revoke refresh token at SSO level
 */
export async function destroySSOSession(sessionId: string): Promise<void> {
  const db = await getDb();
  await db.collection('ssoSessions').deleteOne({ sessionId });
}

/**
 * WHAT: Destroy all sessions for a user
 * WHY: Security measure (password change, account compromise, etc.)
 */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  const db = await getDb();
  await db.collection('ssoSessions').deleteMany({ userId });
}

// ============================================================================
// Session Cleanup
// ============================================================================

/**
 * WHAT: Delete expired sessions from database
 * WHY: Keep database clean; remove stale sessions
 * WHEN: Call periodically (e.g. daily cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = await getDb();
  const result = await db.collection('ssoSessions').deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount || 0;
}

// ============================================================================
// Session Validation
// ============================================================================

/**
 * WHAT: Check if session is still valid
 * WHY: Determine if user is authenticated
 */
export function isSessionValid(session: SSOSessionDoc): boolean {
  return (
    session.expiresAt > new Date() &&
    session.appPermission.hasAccess &&
    session.appPermission.status === 'approved'
  );
}

/**
 * WHAT: Check if session needs refresh
 * WHY: Tokens expire; refresh before they become invalid
 * RULE: Refresh if last update was >50 minutes ago (10min buffer before 1h expiry)
 */
export function needsRefresh(session: SSOSessionDoc): boolean {
  const age = Date.now() - session.updatedAt.getTime();
  return age > 50 * 60 * 1000; // 50 minutes
}
