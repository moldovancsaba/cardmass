/**
 * WHAT: Unified Authentication Library
 * WHY: Support BOTH legacy admin_session AND SSO sso_session cookies
 * PATTERN: Check both systems, return unified user object
 */

import { validateAdminToken } from './auth';
import { getSSOSession, isSessionValid } from './sso/session';
import type { UserDoc } from './types';
import type { AppRole } from './sso/permissions';

// ============================================================================
// Types
// ============================================================================

/**
 * WHAT: Unified user object (works for both legacy and SSO users)
 * WHY: Consistent interface regardless of auth method
 */
export interface UnifiedUser {
  id: string;                    // User ID (MongoDB ObjectId for legacy, SSO UUID for SSO)
  email: string;                 // Email address
  name: string;                  // Full name
  role: AppRole;                 // Unified role: 'none' | 'user' | 'admin' | 'superadmin'
  authSource: 'legacy' | 'sso';  // Which system authenticated this user
  legacyUser?: Omit<UserDoc, 'password'>; // Full legacy user object (if legacy auth)
  ssoUserId?: string;            // SSO user ID (if SSO auth)
}

// ============================================================================
// Unified Auth Check
// ============================================================================

/**
 * WHAT: Check authentication from BOTH legacy and SSO systems
 * WHY: Dual authentication support during SSO migration
 * @returns Unified user object or null if not authenticated
 */
export async function getAuthenticatedUser(cookies: {
  admin_session?: string;
  sso_session?: string;
}): Promise<UnifiedUser | null> {
  // WHAT: Try SSO first (preferred)
  // WHY: SSO is the future; legacy is deprecated
  if (cookies.sso_session) {
    const ssoSession = await getSSOSession(cookies.sso_session);
    
    if (ssoSession && isSessionValid(ssoSession)) {
      // WHAT: Map SSO role to unified role
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
  
  // WHAT: Fall back to legacy admin_session
  // WHY: Support existing admin users during migration
  if (cookies.admin_session) {
    const legacyUser = await validateAdminToken(cookies.admin_session);
    
    if (legacyUser) {
      // WHAT: Map legacy role to unified role
      // WHY: Legacy only has 'user' and 'super-admin'; map super-admin → superadmin, user → user
      const unifiedRole: AppRole = legacyUser.role === 'super-admin' ? 'superadmin' : 'user';
      
      // WHAT: Ensure _id exists (required for user identification)
      // WHY: MongoDB _id should always be present for validated users
      if (!legacyUser._id) {
        return null;
      }
      
      return {
        id: legacyUser._id.toString(),
        email: legacyUser.email,
        name: legacyUser.name,
        role: unifiedRole,
        authSource: 'legacy',
        legacyUser,
      };
    }
  }
  
  // WHAT: No valid session found
  return null;
}

// ============================================================================
// Permission Checks
// ============================================================================

/**
 * WHAT: Check if user has any access
 * WHY: Gate entry to application
 */
export function hasAccess(user: UnifiedUser | null): boolean {
  return user !== null && user.role !== 'none';
}

/**
 * WHAT: Check if user is admin or superadmin
 * WHY: Gate admin features
 */
export function isAdmin(user: UnifiedUser | null): boolean {
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

/**
 * WHAT: Check if user is superadmin
 * WHY: Gate superadmin-only features
 */
export function isSuperAdmin(user: UnifiedUser | null): boolean {
  return user !== null && user.role === 'superadmin';
}
