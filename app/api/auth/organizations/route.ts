/**
 * GET /api/auth/organizations
 * WHAT: Returns list of organizations (SSO users see all orgs; role determines access level)
 * WHY: Powers the organization selector page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
// Authentication temporarily disabled

export async function GET(req: NextRequest) {
  try {
    // WHAT: Authentication disabled - return all organizations
    const db = await getDb();
    const orgsCol = db.collection('organizations');
    const allOrgs = await orgsCol.find({ isActive: true }).toArray();
    
    // WHAT: Map to organization access format
    const organizations = allOrgs.map(org => ({
      organizationUUID: org.uuid,
      role: 'member' as const, // Default role since auth is disabled
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
