/**
 * pagePassword.ts — MessMass-style page password management
 * 
 * WHAT: Page-level password management for zero-trust Tagger access control.
 * WHY: Enables non-admin viewers to access protected boards via shared passwords.
 * 
 * Core approach:
 * - Password is 32-hex MD5-style token (matches user password format)
 * - One password per { pageId, pageType } (unique compound index)
 * - Idempotent getOrCreatePagePassword() for consistent retrieval
 * - Shareable links include password as query param
 */

import { randomBytes } from 'crypto'
import type { Collection } from 'mongodb'
import { getDb } from './db'
import { isoNow } from './datetime'

/**
 * FUNCTIONAL: Page type for password-protected resources
 * STRATEGIC: Currently only 'tagger' (board pages); extensible for future types
 */
export type PageType = 'tagger'

/**
 * FUNCTIONAL: Page password document schema stored in MongoDB
 * STRATEGIC: Tracks password usage for audit and rotation; expiresAt optional for future enforcement
 */
export interface PagePasswordDoc {
  _id?: import('mongodb').ObjectId
  pageId: string // boardUUID for 'tagger'
  pageType: PageType
  password: string // 32-hex MD5-style token
  createdAt: string // ISO 8601 with milliseconds
  usageCount: number
  lastUsedAt?: string // ISO 8601 with milliseconds
  expiresAt?: string // ISO 8601 with milliseconds (optional, not enforced this phase)
}

/**
 * FUNCTIONAL: Generate a 32-character lowercase hex password (MD5-style)
 * STRATEGIC: Matches MessMass token format; simple, URL-safe, and consistent with user passwords
 * WHY: Using randomBytes ensures cryptographic randomness while maintaining MessMass parity
 */
export function generateMD5StylePassword(): string {
  return randomBytes(16).toString('hex')
}

/**
 * FUNCTIONAL: Returns pagePasswords collection with lazy index creation
 * STRATEGIC: Ensures unique compound index on { pageId, pageType }; prevents duplicate passwords for same page
 */
async function getPagePasswordCollection(): Promise<
  Collection<PagePasswordDoc>
> {
  const db = await getDb()
  const col = db.collection<PagePasswordDoc>('pagePasswords')
  // Lazy index creation: unique compound index on pageId + pageType
  try {
    await col.createIndex({ pageId: 1, pageType: 1 }, { unique: true })
  } catch {
    // Index may already exist; ignore error
  }
  return col
}

/**
 * FUNCTIONAL: Get existing or create new page password for a given pageId + pageType
 * STRATEGIC: Idempotent operation; returns existing password if present, generates new one if absent
 * WHY: Allows multiple calls without regenerating password; useful for UI that needs to re-fetch
 */
export async function getOrCreatePagePassword(
  pageId: string,
  pageType: PageType,
  regenerate = false
): Promise<PagePasswordDoc> {
  const col = await getPagePasswordCollection()

  // If regenerate requested, delete existing entry first
  if (regenerate) {
    await col.deleteOne({ pageId, pageType })
  }

  // Try to find existing password
  const existing = await col.findOne({ pageId, pageType })
  if (existing) return existing

  // Create new password
  const now = isoNow()
  const doc: PagePasswordDoc = {
    pageId,
    pageType,
    password: generateMD5StylePassword(),
    createdAt: now,
    usageCount: 0,
  }
  await col.insertOne(doc)
  return doc
}

/**
 * FUNCTIONAL: Validate provided password against stored password for pageId + pageType
 * STRATEGIC: Returns boolean; increments usageCount and sets lastUsedAt on success
 * WHY: Tracks password usage for audit; enables future analysis of access patterns
 */
export async function validatePagePassword(
  pageId: string,
  pageType: PageType,
  providedPassword: string
): Promise<boolean> {
  const col = await getPagePasswordCollection()
  const doc = await col.findOne({ pageId, pageType })
  if (!doc) return false

  const isValid = doc.password === providedPassword

  if (isValid) {
    // Increment usage count and update lastUsedAt
    const now = isoNow()
    await col.updateOne(
      { _id: doc._id },
      { $inc: { usageCount: 1 }, $set: { lastUsedAt: now } }
    )
  }

  return isValid
}

/**
 * FUNCTIONAL: Validate any provided password (extensible for future multi-password support)
 * STRATEGIC: Returns first valid match; currently just wraps validatePagePassword
 * WHY: Future-proofs for scenarios where multiple passwords might be valid (e.g., admin override password)
 */
export async function validateAnyPassword(
  pageId: string,
  pageType: PageType,
  providedPassword: string
): Promise<{ isValid: boolean; isAdmin: boolean }> {
  const isValid = await validatePagePassword(pageId, pageType, providedPassword)
  return { isValid, isAdmin: false }
}

/**
 * FUNCTIONAL: Generate a shareable link for a Tagger page with password query param
 * STRATEGIC: Constructs canonical URL using baseUrl + org + board + pw param
 * WHY: Enables easy sharing of password-protected boards via single URL
 */
export async function generateShareableLink(
  organizationUUID: string,
  boardUUID: string,
  pageType: PageType,
  baseUrl: string,
  password: string
): Promise<{ url: string; pageType: PageType; password: string }> {
  // Sanitize baseUrl: remove trailing slash
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
  
  // Construct Tagger URL
  let path = ''
  if (pageType === 'tagger') {
    path = `/${encodeURIComponent(organizationUUID)}/${encodeURIComponent(
      boardUUID
    )}/tagger`
  }

  const url = `${cleanBaseUrl}${path}?pw=${encodeURIComponent(password)}`
  return { url, pageType, password }
}
