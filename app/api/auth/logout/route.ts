/**
 * POST/DELETE/GET /api/auth/logout
 * WHAT: SSO logout endpoint
 * WHY: Invalidate SSO session and clear cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { destroySSOSession } from '@/lib/sso/session';

export async function POST(req: NextRequest) {
  try {
    const ssoToken = req.cookies.get('sso_session')?.value;
    if (ssoToken) {
      await destroySSOSession(ssoToken);
    }
    
    const response = NextResponse.json({ success: true });
    response.cookies.delete('sso_session');
    return response;
  } catch (error) {
    console.error('[Logout] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}

export async function GET(req: NextRequest) {
  try {
    const ssoToken = req.cookies.get('sso_session')?.value;
    if (ssoToken) {
      await destroySSOSession(ssoToken);
    }
    
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.delete('sso_session');
    return response;
  } catch (error) {
    console.error('[Logout] Error:', error);
    return NextResponse.redirect(new URL('/?error=logout_failed', req.url));
  }
}
