/**
 * POST/DELETE /api/auth/logout
 * WHAT: Admin logout endpoint for CardMass
 * WHY: Invalidates session token in MongoDB and clears cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // WHAT: Extract session token from cookie
    const token = req.cookies.get('admin_session')?.value;
    
    if (token) {
      // WHAT: Delete session from MongoDB
      await logoutAdmin(token);
    }
    
    // WHAT: Clear session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', '', {
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
