/**
 * GET /api/auth/organizations
 * WHAT: Returns list of organizations (SSO users see all orgs; role determines access level)
 * WHY: Powers the organization selector page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, isSuperAdmin } from '@/lib/unified-auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const ssoToken = req.cookies.get('sso_session')?.value;
    const user = await getAuthenticatedUser({ sso_session: ssoToken });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // WHAT: Get all organizations from database
    // WHY: SSO controls access via app permissions; all authenticated users see all orgs
    const db = await getDb();
    const orgsCol = db.collection('organizations');
    const allOrgs = await orgsCol.find({ isActive: true }).toArray();
    
    // WHAT: Map to organization access format
    const organizations = allOrgs.map(org => ({
      organizationUUID: org.uuid,
      role: isSuperAdmin(user) ? 'superadmin' : user.role,
    }));
    
    return NextResponse.json({
      success: true,
      organizations,
    });
  } catch (error) {
    console.error('[Get Organizations] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
