/**
 * POST /api/page-passwords/validate
 * 
 * WHAT: Validates a page password for access control.
 * WHY: Non-admin viewers submit passwords to gain access to protected pages.
 * 
 * This endpoint is public (no admin auth required) because it's used by viewers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validatePagePassword, type PageType } from '@/lib/pagePassword';

export async function POST(req: NextRequest) {
  try {
    // WHAT: Parse request body
    const body = await req.json();
    const { pageId, pageType, password } = body;

    // WHAT: Validate required fields
    if (!pageId || !pageType || !password) {
      return NextResponse.json(
        { error: 'pageId, pageType, and password are required' },
        { status: 400 }
      );
    }

    // WHAT: Validate pageType
    const validTypes: PageType[] = ['tagger'];
    if (!validTypes.includes(pageType as PageType)) {
      return NextResponse.json(
        { error: `pageType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // WHAT: Validate password
    const isValid = await validatePagePassword(pageId, pageType as PageType, password);

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired password' },
        { status: 401 }
      );
    }

    // WHAT: Set validated password in session cookie
    // WHY: Allows page to check password validity without re-validating on every request
    const response = NextResponse.json({ valid: true });
    
    // WHAT: Store validated page password in a cookie for this specific page
    const cookieName = `page_pass_${pageId}_${pageType}`;
    response.cookies.set(cookieName, password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Validate page password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
