#!/usr/bin/env node
/**
 * Create Admin User Script
 * 
 * WHAT: Inserts a new admin user into the users collection with a generated password.
 * WHY: Bootstrap initial admin access for zero-trust authentication system.
 * 
 * Usage:
 *   node scripts/admin/create-user.mjs --email admin@example.com --name "Admin Name" [--role admin|super-admin]
 * 
 * Or run interactively (will prompt for inputs):
 *   node scripts/admin/create-user.mjs
 */

import { randomBytes } from 'crypto'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import readline from 'readline'

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
 * Prompt user for input (interactive mode)
 */
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const parsed = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      parsed.email = args[i + 1]
      i++
    } else if (args[i] === '--name' && args[i + 1]) {
      parsed.name = args[i + 1]
      i++
    } else if (args[i] === '--role' && args[i + 1]) {
      parsed.role = args[i + 1]
      i++
    }
  }
  return parsed
}

async function main() {
  let client

  try {
    const args = parseArgs()

    // Interactive mode if no args provided
    let email = args.email
    let name = args.name
    let role = args.role || 'admin'

    if (!email) {
      email = await prompt('Email: ')
    }
    if (!name) {
      name = await prompt('Name: ')
    }
    if (!args.role) {
      const roleInput = await prompt('Role (admin/super-admin) [admin]: ')
      role = roleInput || 'admin'
    }

    // Validate inputs
    if (!email || !name) {
      console.error('❌ Email and name are required')
      process.exit(1)
    }

    if (!['admin', 'super-admin'].includes(role)) {
      console.error('❌ Role must be "admin" or "super-admin"')
      process.exit(1)
    }

    email = email.toLowerCase()

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...')
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(MONGODB_DBNAME)
    const usersCol = db.collection('users')

    // Create unique index on email
    try {
      await usersCol.createIndex({ email: 1 }, { unique: true })
    } catch (err) {
      // Index may already exist
    }

    // Check if user already exists
    const existing = await usersCol.findOne({ email })
    if (existing) {
      console.error(`❌ User with email ${email} already exists`)
      process.exit(1)
    }

    // Generate password
    const password = generatePassword()
    const now = new Date().toISOString()

    // Insert user
    const doc = {
      email,
      name,
      role,
      password,
      createdAt: now,
      updatedAt: now,
    }

    const result = await usersCol.insertOne(doc)

    console.log('\n✅ Admin user created successfully!\n')
    console.log('📧 Email:', email)
    console.log('👤 Name:', name)
    console.log('🔑 Role:', role)
    console.log('🆔 User ID:', result.insertedId.toString())
    console.log('\n🔐 PASSWORD (save this securely):')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(password)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('⚠️  This password will not be shown again!')
    console.log('💡 Use it to login at: POST /api/admin/login')
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
