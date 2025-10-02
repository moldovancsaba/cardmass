import { ObjectId, type Collection } from 'mongodb'
import { getDb } from './db'
import { isoNow } from './datetime'

/**
 * FUNCTIONAL: User role types for admin access control
 * STRATEGIC: Matches MessMass model for zero-trust authentication
 */
export type UserRole = 'admin' | 'super-admin'

/**
 * FUNCTIONAL: User document schema stored in MongoDB
 * STRATEGIC: Stores password as 32-hex MD5-style token (NOT a hash) per MessMass parity;
 *            this is deliberate to enable shareable credentials while maintaining HttpOnly cookie security
 */
export interface UserDoc {
  _id?: ObjectId
  email: string
  name: string
  role: UserRole
  password: string // 32-hex MD5-style token (plaintext-equivalent)
  createdAt: string // ISO 8601 with milliseconds
  updatedAt: string // ISO 8601 with milliseconds
}

/**
 * FUNCTIONAL: Returns users collection with lazy index creation
 * STRATEGIC: Ensures unique email index exists; centralizes collection access to avoid drift
 */
export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb()
  const col = db.collection<UserDoc>('users')
  // Lazy index creation: unique on email to enforce single account per email
  try {
    await col.createIndex({ email: 1 }, { unique: true })
  } catch {
    // Index may already exist; ignore error
  }
  return col
}

/**
 * FUNCTIONAL: Find user by email address (case-insensitive)
 * STRATEGIC: Primary lookup for login flow; email is lowercased on insert/query
 */
export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const col = await getUsersCollection()
  return col.findOne({ email: email.toLowerCase() })
}

/**
 * FUNCTIONAL: Find user by ObjectId
 * STRATEGIC: Used during session validation to confirm user still exists and has correct role
 */
export async function findUserById(id: string): Promise<UserDoc | null> {
  const col = await getUsersCollection()
  if (!ObjectId.isValid(id)) return null
  return col.findOne({ _id: new ObjectId(id) })
}

/**
 * FUNCTIONAL: Create a new admin user with generated or provided password
 * STRATEGIC: Enforces unique email via index; sets ISO timestamps; lowercases email
 */
export async function createUser(
  user: Omit<UserDoc, '_id' | 'createdAt' | 'updatedAt'>
): Promise<UserDoc> {
  const col = await getUsersCollection()
  const now = isoNow()
  const doc: Omit<UserDoc, '_id'> = {
    ...user,
    email: user.email.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  }
  const res = await col.insertOne(doc as UserDoc)
  return { _id: res.insertedId, ...doc }
}

/**
 * FUNCTIONAL: Update user's password token and refresh updatedAt timestamp
 * STRATEGIC: Allows password rotation without recreating user; maintains audit trail via updatedAt
 */
export async function updateUserPassword(
  userId: string,
  password: string
): Promise<UserDoc | null> {
  const col = await getUsersCollection()
  if (!ObjectId.isValid(userId)) return null
  const now = isoNow()
  await col.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { password, updatedAt: now } }
  )
  return findUserById(userId)
}
