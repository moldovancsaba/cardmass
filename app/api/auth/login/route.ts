/**
 * POST /api/auth/login
 * 
 * WHAT: Admin login endpoint for CardMass using MD5 password hashing.
 * WHY: Validates credentials with MD5-hashed passwords and issues HttpOnly session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // WHAT: Parse and validate request body
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // WHAT: Authenticate user with MD5-hashed password comparison
    // WHY: loginAdmin hashes input password with MD5 and compares with stored hash
    const result = await loginAdmin(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // WHAT: Set HttpOnly session cookie with 30-day expiry
    // WHY: Secure client-side token storage, inaccessible to JavaScript
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    response.cookies.set('admin_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
