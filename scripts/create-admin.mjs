/**
 * create-admin.mjs
 * 
 * WHAT: CLI script to create admin users in MongoDB.
 * WHY: Bootstrap utility for zero-trust authentication system.
 * 
 * Usage:
 *   node scripts/create-admin.mjs
 * 
 * Prompts for email, name, password, and role interactively.
 */

import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import readline from 'readline';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// WHAT: Load .env.local file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const envPath = join(projectRoot, '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch (err) {
  // .env.local not found or cannot be read
}

// WHAT: Hash password using MD5 (matches auth.ts implementation)
function hashPassword(plaintext) {
  return crypto.createHash('md5').update(plaintext).digest('hex');
}

// WHAT: Prompt user for input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔐 CardMass Admin User Creation\n');

  // WHAT: Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DBNAME || 'cardmass';

  if (!uri) {
    console.error('❌ Error: MONGODB_URI environment variable is not set.');
    console.error('   Please create a .env.local file with MONGODB_URI=your_connection_string');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db(dbName);
    const usersCol = db.collection('users');

    // WHAT: Prompt for user details
    const email = (await prompt('Email: ')).trim().toLowerCase();
    const name = (await prompt('Name: ')).trim();
    const password = (await prompt('Password (will be hashed): ')).trim();
    const roleInput = (await prompt('Role (admin/super-admin) [admin]: ')).trim().toLowerCase();
    const role = roleInput === 'super-admin' ? 'super-admin' : 'admin';

    // WHAT: Validate input
    if (!email || !name || !password) {
      console.error('\n❌ Error: All fields are required.');
      process.exit(1);
    }

    if (!email.includes('@')) {
      console.error('\n❌ Error: Invalid email format.');
      process.exit(1);
    }

    // WHAT: Check if user already exists
    const existing = await usersCol.findOne({ email });
    if (existing) {
      console.error(`\n❌ Error: User with email "${email}" already exists.`);
      process.exit(1);
    }

    // WHAT: Create user document
    const now = new Date().toISOString();
    const userDoc = {
      email,
      name,
      role,
      password: hashPassword(password),
      createdAt: now,
      updatedAt: now,
    };

    // WHAT: Insert user
    const result = await usersCol.insertOne(userDoc);

    console.log('\n✅ Admin user created successfully!');
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: ${role}`);
    console.log(`   Password: <hashed with MD5>\n`);
    console.log('💡 You can now login at /api/auth/login with these credentials.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
