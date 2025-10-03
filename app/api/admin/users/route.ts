/**
 * WHAT: System-level user management API (super-admin only)
 * WHY: Super-admins need to manage all users across the system
 * 
 * GET: List all users
 * POST: Create new user or update existing user (role, password)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { validateAdminToken } from '@/lib/auth'
import { isoNow } from '@/lib/datetime'
import * as crypto from 'crypto'

// WHAT: Generate bcrypt-compatible hash using Node's built-in crypto
// WHY: We need to hash passwords securely; bcrypt is not compatible with Next.js edge runtime
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export async function GET(req: NextRequest) {
  try {
    // WHAT: Validate super-admin access
    const token = req.cookies.get('admin_session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateAdminToken(token)
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden: super-admin only' }, { status: 403 })
    }

    // WHAT: Fetch all users from database
    const db = await getDb()
    const users = await db.collection('users')
      .find({})
      .project({ password: 0, token: 0 }) // WHAT: Exclude sensitive fields
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // WHAT: Validate super-admin access
    const token = req.cookies.get('admin_session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateAdminToken(token)
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden: super-admin only' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, email, name, role, password } = body

    const db = await getDb()
    const usersCol = db.collection('users')

    // WHAT: Update existing user (role or password)
    if (userId) {
      const updateFields: Record<string, unknown> = { updatedAt: isoNow() }

      if (role && ['user', 'super-admin'].includes(role)) {
        updateFields.role = role
      }

      if (password && typeof password === 'string' && password.length >= 8) {
        updateFields.password = hashPassword(password)
      }

      const result = await usersCol.updateOne(
        { _id: new (await import('mongodb')).ObjectId(userId) },
        { $set: updateFields }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: 'User updated' })
    }

    // WHAT: Create new user
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'email, name, and password are required for new users' },
        { status: 400 }
      )
    }

    // WHAT: Check if user already exists
    const existing = await usersCol.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // WHAT: Create new user document
    const newUser = {
      email,
      name,
      password: hashPassword(password),
      role: role && ['user', 'super-admin'].includes(role) ? role : 'user',
      createdAt: isoNow(),
      updatedAt: isoNow()
    }

    await usersCol.insertOne(newUser)

    return NextResponse.json({
      success: true,
      message: 'User created',
      user: {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error managing users:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
