#!/usr/bin/env node
/**
 * Update Admin Password Script
 * 
 * WHAT: Generates a new password for an existing admin user.
 * WHY: Allows password rotation for security or if password is compromised.
 * 
 * Usage:
 *   node scripts/admin/update-password.mjs <email>
 * 
 * Example:
 *   node scripts/admin/update-password.mjs admin@doneisbetter.com
 */

import { randomBytes, createHash } from 'crypto'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DBNAME = process.env.MONGODB_DBNAME || 'cardmass'

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env.local')
  process.exit(1)
}

/**
 * Generate 32-character lowercase hex password (MD5-style)
 */
function generatePassword() {
  return randomBytes(16).toString('hex')
}

/**
 * WHAT: Hash password with MD5 to match server-side authentication
 * WHY: The login flow in src/lib/auth.ts compares MD5 hashes; storing plaintext breaks login.
 *      This matches the hashPassword function in src/lib/auth.ts for MVP parity.
 *      NOTE: MD5 is NOT cryptographically secure; suitable for MVP only, not production.
 */
function hashPassword(plaintext) {
  return createHash('md5').update(plaintext).digest('hex')
}

async function main() {
  let client

  try {
    const email = process.argv[2]

    if (!email) {
      console.error('Usage: node scripts/admin/update-password.mjs <email>')
      console.error('Example: node scripts/admin/update-password.mjs admin@example.com')
      process.exit(1)
    }

    const emailLower = email.toLowerCase()

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...')
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(MONGODB_DBNAME)
    const usersCol = db.collection('users')

    // Find user
    const user = await usersCol.findOne({ email: emailLower })
    if (!user) {
      console.error(`❌ User with email ${emailLower} not found`)
      process.exit(1)
    }

    // Generate new password
    const newPassword = generatePassword()
    const now = new Date().toISOString()

    // WHAT: Hash password with MD5 before persisting to database
    // WHY: The login path compares MD5 hashes; storing plaintext breaks authentication
    await usersCol.updateOne(
      { _id: user._id },
      { $set: { password: hashPassword(newPassword), updatedAt: now } }
    )

    console.log('\n✅ Password updated successfully!\n')
    console.log('📧 Email:', emailLower)
    console.log('👤 Name:', user.name)
    console.log('🔑 Role:', user.role)
    console.log('\n🔐 NEW PASSWORD (save this securely):')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(newPassword)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('⚠️  Old password is now invalid!')
    console.log('💡 Use the new password to login at: POST /api/admin/login')
    console.log('')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

main()
