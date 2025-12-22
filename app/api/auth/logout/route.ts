/**
 * POST/DELETE/GET /api/auth/logout
 * WHAT: Unified logout endpoint for CardMass (legacy + SSO)
 * WHY: Invalidates sessions and clears cookies for both authentication systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/auth';
import { destroySSOSession } from '@/lib/sso/session';

export async function POST(req: NextRequest) {
  try {
    // WHAT: Extract both session tokens
    const legacyToken = req.cookies.get('admin_session')?.value;
    const ssoToken = req.cookies.get('sso_session')?.value;
    
    // WHAT: Delete legacy session from MongoDB
    if (legacyToken) {
      await logoutAdmin(legacyToken);
    }
    
    // WHAT: Delete SSO session from MongoDB
    if (ssoToken) {
      await destroySSOSession(ssoToken);
    }
    
    // WHAT: Clear both session cookies
    const response = NextResponse.json({ success: true });
    
    // Clear legacy admin_session
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    // Clear SSO sso_session
    response.cookies.set('sso_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// WHAT: Support DELETE method for semantic correctness
export async function DELETE(req: NextRequest) {
  return POST(req);
}

// WHAT: Support GET method for logout links
// WHY: Button component uses href links which trigger GET requests
export async function GET(req: NextRequest) {
  try {
    // WHAT: Extract both session tokens
    const legacyToken = req.cookies.get('admin_session')?.value;
    const ssoToken = req.cookies.get('sso_session')?.value;
    
    // WHAT: Delete legacy session from MongoDB
    if (legacyToken) {
      await logoutAdmin(legacyToken);
    }
    
    // WHAT: Delete SSO session from MongoDB
    if (ssoToken) {
      await destroySSOSession(ssoToken);
    }
    
    // WHAT: Clear both cookies and redirect to home
    // WHY: GET requests should redirect after logout (not JSON response)
    const response = NextResponse.redirect(new URL('/', req.url));
    
    // Clear legacy admin_session
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    // Clear SSO sso_session
    response.cookies.set('sso_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Redirect to home even on error (clear cookies client-side)
    return NextResponse.redirect(new URL('/?error=logout_failed', req.url));
  }
}
