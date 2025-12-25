/**
 * GET /api/auth/check
 * WHAT: Verify SSO session only (admin_session disabled)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, hasAccess } from '@/lib/unified-auth';

export async function GET(req: NextRequest) {
  try {
    // WHAT: Extract SSO cookie only
    const ssoSession = req.cookies.get('sso_session')?.value;
    if (!ssoSession) {
      return NextResponse.json({ authenticated: false });
    }

    // WHAT: Validate SSO session
    const user = await getAuthenticatedUser({ sso_session: ssoSession });
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
