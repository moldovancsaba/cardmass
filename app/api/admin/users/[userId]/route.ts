/**
 * WHAT: Delete system user API (super-admin only)
 * WHY: Super-admins need ability to remove users from the system
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { validateAdminToken } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params
    const db = await getDb()
    
    // WHAT: Prevent deleting the last super-admin
    const superAdminCount = await db.collection('users').countDocuments({ role: 'super-admin' })
    const targetUser = await db.collection('users').findOne({
      _id: new (await import('mongodb')).ObjectId(userId)
    })

    if (targetUser?.role === 'super-admin' && superAdminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last super-admin' },
        { status: 403 }
      )
    }

    // WHAT: Delete user
    const result = await db.collection('users').deleteOne({
      _id: new (await import('mongodb')).ObjectId(userId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'User deleted' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
