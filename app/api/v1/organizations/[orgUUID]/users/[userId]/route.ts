/**
 * DELETE /api/v1/organizations/{orgUUID}/users/{userId}
 * WHAT: Remove user's access to an organization
 * WHY: Org admins need to revoke access when users leave
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isUUIDv4 } from '@/lib/validation';
import { validateAdminToken, checkOrgAccess } from '@/lib/auth';
import type { UserDoc } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ orgUUID: string; userId: string }> }
) {
  const { orgUUID, userId } = await ctx.params;
  
  if (!isUUIDv4(orgUUID)) {
    return NextResponse.json(
      { error: { code: 'INVALID_ID', message: 'Invalid organization UUID' } },
      { status: 400 }
    );
  }

  try {
    // WHAT: Authenticate and check org admin access
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await validateAdminToken(token);
    if (!currentUser || !currentUser._id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const orgRole = await checkOrgAccess(currentUser._id.toString(), orgUUID);
    if (orgRole !== 'org-admin' && orgRole !== 'super-admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions - org-admin required' },
        { status: 403 }
      );
    }

    // WHAT: Remove org access from user
    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');

    const targetUser = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // WHAT: Can't remove super-admins (they have global access)
    if (targetUser.role === 'super-admin') {
      return NextResponse.json(
        { error: 'Cannot remove super-admin from organization' },
        { status: 400 }
      );
    }

    // WHAT: Filter out this org from organizationAccess
    const orgAccess = (targetUser.organizationAccess || []).filter(
      a => a.organizationUUID !== orgUUID
    );

    await usersCol.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          organizationAccess: orgAccess,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'User access revoked from organization',
    });
  } catch (error) {
    console.error('Remove org user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
