/**
 * POST /api/v1/organizations/{orgUUID}/users
 * WHAT: Add or update user access to an organization
 * WHY: Org admins need to grant/manage access to their organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isUUIDv4 } from '@/lib/validation';
import { validateAdminToken, checkOrgAccess } from '@/lib/auth';
import type { UserDoc } from '@/lib/types';
import { ObjectId } from 'mongodb';

/**
 * GET - List all users with access to this organization
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ orgUUID: string }> }
) {
  const { orgUUID } = await ctx.params;
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

    const user = await validateAdminToken(token);
    if (!user || !user._id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const orgRole = await checkOrgAccess(user._id.toString(), orgUUID);
    if (orgRole !== 'org-admin' && orgRole !== 'super-admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // WHAT: Find all users with access to this org
    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');
    
    const users = await usersCol
      .find({
        $or: [
          { role: 'super-admin' },
          { 'organizationAccess.organizationUUID': orgUUID }
        ]
      })
      .toArray();

    // WHAT: Return users without passwords
    const safeUsers = users.map(u => {
      const orgAccess = u.organizationAccess?.find(a => a.organizationUUID === orgUUID);
      return {
        id: u._id?.toString(),
        email: u.email,
        name: u.name,
        globalRole: u.role,
        orgRole: u.role === 'super-admin' ? 'super-admin' : orgAccess?.role || 'none',
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('List org users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Add user to organization or update their role
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ orgUUID: string }> }
) {
  const { orgUUID } = await ctx.params;
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

    // WHAT: Parse request body
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'org-admin' && role !== 'member') {
      return NextResponse.json(
        { error: 'role must be org-admin or member' },
        { status: 400 }
      );
    }

    // WHAT: Update user's organizationAccess
    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');

    const targetUser = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // WHAT: Add or update org access
    const orgAccess = targetUser.organizationAccess || [];
    const existingIndex = orgAccess.findIndex(a => a.organizationUUID === orgUUID);

    if (existingIndex >= 0) {
      orgAccess[existingIndex].role = role;
    } else {
      orgAccess.push({ organizationUUID: orgUUID, role });
    }

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
      message: `User ${role} access granted to organization`,
    });
  } catch (error) {
    console.error('Add org user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
