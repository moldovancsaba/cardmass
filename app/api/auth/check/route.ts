/**
 * GET /api/auth/check
 * WHAT: Verify SSO session only (admin_session disabled)
 */

import { NextRequest, NextResponse } from 'next/server';
// Authentication temporarily disabled

export async function GET(req: NextRequest) {
  // WHAT: Authentication disabled - always return not authenticated
  // WHY: App works without auth for testing
  return NextResponse.json({ authenticated: false });
}
