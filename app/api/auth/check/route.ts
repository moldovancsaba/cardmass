/**
 * GET /api/auth/check
 * WHAT: Verify admin session token from cookie
 * WHY: UI needs to know if user is authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // WHAT: Extract session token from httpOnly cookie
    const token = req.cookies.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }
    
    // WHAT: Validate token and fetch user from database
    const user = await validateAdminToken(token);
    
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
