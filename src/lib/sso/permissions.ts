/**
 * WHAT: SSO App-Level Permissions Library
 * WHY: Manage CardMass-specific user roles and access via SSO
 * PATTERN: Centralized permission queries to SSO service
 */

// WHAT: SSO configuration
const SSO_BASE_URL = process.env.SSO_BASE_URL || 'https://sso.doneisbetter.com';
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID || '';

// ============================================================================
// Types
// ============================================================================

/**
 * WHAT: App permission status
 * WHY: SSO manages app access with approval workflow
 */
export type PermissionStatus = 'approved' | 'pending' | 'revoked' | 'none';

/**
 * WHAT: App role hierarchy
 * WHY: Different permission levels within CardMass
 */
export type AppRole = 'none' | 'user' | 'admin' | 'superadmin';

/**
 * WHAT: Complete app permission record
 * WHY: Returned by SSO permissions API
 */
export interface AppPermission {
  userId: string;
  clientId: string;
  appName: string;
  hasAccess: boolean;
  status: PermissionStatus;
  role: AppRole;
  requestedAt?: string;
  grantedAt?: string;
  grantedBy?: string;
  lastAccessedAt?: string;
}

// ============================================================================
// Query Permission
// ============================================================================

/**
 * WHAT: Get user's permission for CardMass from SSO
 * WHY: Check if user has access and what role they have
 */
export async function getAppPermission(
  userId: string,
  accessToken: string
): Promise<AppPermission> {
  const response = await fetch(
    `${SSO_BASE_URL}/api/users/${userId}/apps/${SSO_CLIENT_ID}/permissions`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  // WHAT: If 404, user has never requested access
  // WHY: Return default "none" permission instead of throwing error
  if (response.status === 404) {
    return {
      userId,
      clientId: SSO_CLIENT_ID,
      appName: 'CardMass',
      hasAccess: false,
      status: 'none',
      role: 'none',
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to get permission: ${response.status}`);
  }

  return await response.json();
}

// ============================================================================
// Request Access
// ============================================================================

/**
 * WHAT: Request access to CardMass (creates pending permission)
 * WHY: User has logged in but no permission exists yet; needs admin approval
 */
export async function requestAppAccess(
  userId: string,
  accessToken: string
): Promise<AppPermission> {
  const response = await fetch(
    `${SSO_BASE_URL}/api/users/${userId}/apps/${SSO_CLIENT_ID}/request-access`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // SSO auto-fills from access token
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to request access: ${response.status}`);
  }

  return await response.json();
}

// ============================================================================
// Permission Checks
// ============================================================================

/**
 * WHAT: Check if user has any access to CardMass
 * WHY: Gate entry to the app
 */
export function hasAppAccess(permission: AppPermission): boolean {
  return permission.hasAccess && permission.status === 'approved';
}

/**
 * WHAT: Check if user is admin or superadmin in CardMass
 * WHY: Gate access to admin features (org settings, user management)
 */
export function isAppAdmin(permission: AppPermission): boolean {
  return (
    hasAppAccess(permission) &&
    (permission.role === 'admin' || permission.role === 'superadmin')
  );
}

/**
 * WHAT: Check if user is superadmin in CardMass
 * WHY: Gate access to superadmin-only features (system settings)
 */
export function isAppSuperAdmin(permission: AppPermission): boolean {
  return hasAppAccess(permission) && permission.role === 'superadmin';
}

/**
 * WHAT: Check if permission is pending approval
 * WHY: Show "waiting for approval" page instead of "access denied"
 */
export function isPending(permission: AppPermission): boolean {
  return permission.status === 'pending';
}

/**
 * WHAT: Check if permission was revoked
 * WHY: Show "access revoked" page with explanation
 */
export function isRevoked(permission: AppPermission): boolean {
  return permission.status === 'revoked';
}

// ============================================================================
// Permission Sync
// ============================================================================

/**
 * WHAT: Refresh user's permission from SSO
 * WHY: Permissions may change (admin grants access, changes role)
 * WHEN: Call periodically (e.g. every 5 minutes) or on key actions
 */
export async function syncPermission(
  userId: string,
  accessToken: string
): Promise<AppPermission> {
  return await getAppPermission(userId, accessToken);
}

/**
 * WHAT: Check if permission needs refresh (stale data)
 * WHY: Avoid excessive API calls while keeping permissions current
 * RULE: Refresh if last sync was >5 minutes ago
 */
export function isPermissionStale(lastSyncAt: Date, nowMs?: number): boolean {
  const now = nowMs || Date.now();
  const age = now - lastSyncAt.getTime();
  return age > 5 * 60 * 1000; // 5 minutes
}
