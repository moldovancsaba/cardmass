/**
 * CardMass authentication library with MD5 password hashing
 * WHAT: Server-side admin authentication with session token management
 * WHY: Zero-trust model for admin access; MD5 hashing for MVP simplicity (NOT cryptographically secure)
 */

import { getDb } from './db';
import type { UserDoc } from './types';
import crypto from 'crypto';

const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';

/**
 * Generate random 32-character hex token
 * WHAT: Creates cryptographically random session tokens
 * WHY: Stateless session identification without JWT dependencies
 */
export function generateToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash password with MD5
 * WHAT: One-way hash using MD5 algorithm
 * WHY: MVP simplicity; NOT cryptographically secure (use bcrypt/argon2 for production)
 */
export function hashPassword(plaintext: string): string {
  return crypto.createHash('md5').update(plaintext).digest('hex');
}

/**
 * Authenticate admin user and create session
 * WHAT: Validates email/password, generates session token, stores in MongoDB
 * WHY: Core login logic with MD5 password comparison
 * @returns Success with token/user or failure with error message
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<
  | { success: true; token: string; user: Omit<UserDoc, 'password'> }
  | { success: false; error: string }
> {
  const db = await getDb();
  const usersCol = db.collection<UserDoc>(USERS_COLLECTION);
  
  // Find user by email (case-insensitive)
  const user = await usersCol.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  // Hash input password and compare with stored hash
  const hashedInput = hashPassword(password);
  if (user.password !== hashedInput) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  // Generate session token and store in database
  const token = generateToken();
  const sessionsCol = db.collection(SESSIONS_COLLECTION);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  
  await sessionsCol.insertOne({
    token,
    userId: user._id,
    email: user.email,
    createdAt: now,
    expiresAt,
  });
  
  // Return user without password field
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...safeUser } = user;
  return { success: true, token, user: safeUser };
}

/**
 * Validate session token and return user
 * WHAT: Looks up session in MongoDB, checks expiration, returns user
 * WHY: Server-side token validation for protected routes
 * @returns User object without password, or null if invalid/expired
 */
export async function validateAdminToken(
  token: string
): Promise<Omit<UserDoc, 'password'> | null> {
  if (!token || token.length !== 32) return null;
  
  const db = await getDb();
  const sessionsCol = db.collection(SESSIONS_COLLECTION);
  
  // Find session by token
  const session = await sessionsCol.findOne({ token });
  if (!session) return null;
  
  // Check expiration
  const now = new Date();
  if (session.expiresAt && new Date(session.expiresAt) < now) {
    await sessionsCol.deleteOne({ token });
    return null;
  }
  
  // Fetch user from database
  const usersCol = db.collection<UserDoc>(USERS_COLLECTION);
  const user = await usersCol.findOne({ _id: session.userId });
  if (!user) return null;
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Invalidate session token
 * WHAT: Deletes session from MongoDB
 * WHY: Logout functionality
 * @returns true if session was deleted, false otherwise
 */
export async function logoutAdmin(token: string): Promise<boolean> {
  if (!token) return false;
  
  const db = await getDb();
  const result = await db.collection(SESSIONS_COLLECTION).deleteOne({ token });
  return result.deletedCount === 1;
}

/**
 * Create new admin user (super-admin only)
 * WHAT: Inserts new user with MD5-hashed password
 * WHY: User management for super-admins
 */
export async function createAdminUser(params: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'super-admin';
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  const db = await getDb();
  const usersCol = db.collection<UserDoc>(USERS_COLLECTION);
  
  // Check if user already exists
  const existing = await usersCol.findOne({ email: params.email.toLowerCase() });
  if (existing) {
    return { success: false, error: 'User with this email already exists' };
  }
  
  // Create user with hashed password
  const now = new Date().toISOString();
  const result = await usersCol.insertOne({
    email: params.email.toLowerCase(),
    password: hashPassword(params.password),
    name: params.name,
    role: params.role,
    createdAt: now,
    updatedAt: now,
  });
  
  return { success: true, userId: result.insertedId.toString() };
}

/**
 * Get all admin users (super-admin only)
 * WHAT: Fetches all users without password fields
 * WHY: User management UI
 */
export async function getAllAdmins(): Promise<Omit<UserDoc, 'password'>[]> {
  const db = await getDb();
  const usersCol = db.collection<UserDoc>(USERS_COLLECTION);
  
  const users = await usersCol.find({}).toArray();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return users.map(({ password: _, ...safeUser }) => safeUser);
}

/**
 * Get admin user by email
 * WHAT: Lookup user by email address
 * WHY: User management and validation
 */
export async function getAdminByEmail(
  email: string
): Promise<Omit<UserDoc, 'password'> | null> {
  const db = await getDb();
  const usersCol = db.collection<UserDoc>(USERS_COLLECTION);
  
  const user = await usersCol.findOne({ email: email.toLowerCase() });
  if (!user) return null;
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...safeUser } = user;
  return safeUser;
}
