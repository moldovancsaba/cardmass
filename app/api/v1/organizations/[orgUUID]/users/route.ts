/**
 * POST /api/v1/organizations/{orgUUID}/users
 * WHAT: Add or update user access to an organization (role and/or password)
 * WHY: Org admins need to grant/manage access and reset passwords for their organization users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isUUIDv4 } from '@/lib/validation';
import { validateAdminToken, checkOrgAccess } from '@/lib/auth';
import type { UserDoc } from '@/lib/types';
import { ObjectId } from 'mongodb';
import * as crypto from 'crypto';

/**
 * WHAT: Generate secure password hash using Node's built-in crypto
 * WHY: Password updates need secure hashing; bcrypt not compatible with Next.js edge runtime
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

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
    // WHY: Frontend component expects _id field (not id) for consistency with MongoDB ObjectId patterns
    const safeUsers = users.map(u => {
      const orgAccess = u.organizationAccess?.find(a => a.organizationUUID === orgUUID);
      return {
        _id: u._id?.toString(),
        email: u.email,
        name: u.name,
        globalRole: u.role,
        orgRole: u.role === 'super-admin' ? 'super-admin' : orgAccess?.role || 'none',
        isSuperAdmin: u.role === 'super-admin',
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
    const { userId, email, name, role, password } = body;

    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');

    // WHAT: Handle new user creation vs existing user update
    // WHY: Org admins need to both create new users AND update existing ones
    if (!userId && email && name && password) {
      // CASE 1: Create new user with org access
      
      // Validate inputs
      if (!role || (role !== 'org-admin' && role !== 'member')) {
        return NextResponse.json(
          { error: 'role must be org-admin or member for new users' },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'password must be at least 8 characters' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existing = await usersCol.findOne({ email });
      if (existing) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      // Create new user
      const newUser = {
        email,
        name,
        password: hashPassword(password),
        role: 'user' as const, // New org users are regular users by default
        organizationAccess: [
          {
            organizationUUID: orgUUID,
            role: role as 'org-admin' | 'member',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await usersCol.insertOne(newUser);

      return NextResponse.json({
        success: true,
        message: 'User created and added to organization',
      }, { status: 201 });
    }

    // CASE 2: Update existing user
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required for updates, or provide email/name/password to create new user' },
        { status: 400 }
      );
    }

    // WHAT: Validate role if provided
    if (role && role !== 'org-admin' && role !== 'member') {
      return NextResponse.json(
        { error: 'role must be org-admin or member' },
        { status: 400 }
      );
    }

    const targetUser = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // WHAT: Prevent password changes for super-admins by org admins
    // WHY: Only super-admins should be able to change super-admin passwords
    if (password && targetUser.role === 'super-admin' && orgRole !== 'super-admin') {
      return NextResponse.json(
        { error: 'Cannot change super-admin password' },
        { status: 403 }
      );
    }

    // WHAT: Build update fields object
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // WHAT: Update password if provided
    // WHY: Org admins can regenerate passwords for their organization members
    if (password && typeof password === 'string' && password.length >= 8) {
      updateFields.password = hashPassword(password);
    }

    // WHAT: Update org access role if provided
    if (role) {
      const orgAccess = targetUser.organizationAccess || [];
      const existingIndex = orgAccess.findIndex(a => a.organizationUUID === orgUUID);

      if (existingIndex >= 0) {
        orgAccess[existingIndex].role = role;
      } else {
        orgAccess.push({ organizationUUID: orgUUID, role });
      }

      updateFields.organizationAccess = orgAccess;
    }

    await usersCol.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields }
    );

    // WHAT: Build success message based on what was updated
    let message = 'User updated';
    if (password && role) {
      message = 'Password and role updated successfully';
    } else if (password) {
      message = 'Password updated successfully';
    } else if (role) {
      message = `User ${role} access granted to organization`;
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Add org user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
