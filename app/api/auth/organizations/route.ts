/**
 * GET /api/auth/organizations
 * WHAT: Returns list of organizations the authenticated user can access
 * WHY: Powers the organization selector page
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, getUserOrganizations } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // WHAT: Extract and validate session token
    const token = req.cookies.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = await validateAdminToken(token);
    
    if (!user || !user._id) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    // WHAT: Get user's accessible organizations
    const organizations = await getUserOrganizations(user._id.toString());
    
    return NextResponse.json({
      success: true,
      organizations,
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
