/**
 * GET /api/auth/check
 * WHAT: Verify session from BOTH legacy admin_session AND SSO sso_session cookies
 * WHY: Support dual authentication during SSO migration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, hasAccess } from '@/lib/unified-auth';

export async function GET(req: NextRequest) {
  try {
    // WHAT: Extract both session cookies
    // WHY: Support both legacy and SSO authentication
    const adminSession = req.cookies.get('admin_session')?.value;
    const ssoSession = req.cookies.get('sso_session')?.value;
    
    if (!adminSession && !ssoSession) {
      return NextResponse.json({ authenticated: false });
    }
    
    // WHAT: Check authentication from both systems
    // WHY: Unified auth checks SSO first, then falls back to legacy
    const user = await getAuthenticatedUser({
      admin_session: adminSession,
      sso_session: ssoSession,
    });
    
    if (!user || !hasAccess(user)) {
      return NextResponse.json({ authenticated: false });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        authSource: user.authSource,
      },
    });
  } catch (error) {
    console.error('[Auth Check] Error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
