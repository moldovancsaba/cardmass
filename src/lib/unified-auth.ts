/**
 * WHAT: Unified Authentication Library (SSO-only)
 * WHY: The system has fully migrated to SSO; legacy admin_session is disabled
 * PATTERN: Validate SSO session and return unified user object
 */

import { getSSOSession, isSessionValid } from './sso/session';
import type { AppRole } from './sso/permissions';

// ============================================================================
// Types
// ============================================================================

/**
 * WHAT: Unified user object (SSO users only)
 * WHY: Consistent interface
 */
export interface UnifiedUser {
  id: string;                    // SSO user ID (UUID)
  email: string;                 // Email address
  name: string;                  // Full name
  role: AppRole;                 // 'none' | 'user' | 'admin' | 'superadmin'
  authSource: 'sso';             // Authentication source (SSO only)
  ssoUserId?: string;            // SSO user ID
}

// ============================================================================
// Auth Check (SSO-only)
// ============================================================================

/**
 * WHAT: Check authentication from SSO system only
 * WHY: Legacy admin_session is permanently disabled
 * @returns Unified user object or null if not authenticated
 */
export async function getAuthenticatedUser(cookies: {
  sso_session?: string;
}): Promise<UnifiedUser | null> {
  if (cookies.sso_session) {
    const ssoSession = await getSSOSession(cookies.sso_session);
    if (ssoSession && isSessionValid(ssoSession)) {
      const role = ssoSession.appPermission.role;
      return {
        id: ssoSession.userId,
        email: ssoSession.email,
        name: ssoSession.name,
        role,
        authSource: 'sso',
        ssoUserId: ssoSession.userId,
      };
    }
  }
  return null;
}

// ============================================================================
// Permission Checks
// ============================================================================

export function hasAccess(user: UnifiedUser | null): boolean {
  return user !== null && user.role !== 'none';
}

export function isAdmin(user: UnifiedUser | null): boolean {
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

export function isSuperAdmin(user: UnifiedUser | null): boolean {
  return user !== null && user.role === 'superadmin';
}
