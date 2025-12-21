/**
 * create-admin-quick.mjs
 * 
 * WHAT: Non-interactive admin user creation script.
 * WHY: Quick bootstrap for zero-trust authentication system.
 * 
 * Usage:
 *   node scripts/create-admin-quick.mjs <email> <name> <password> [role]
 * 
 * Example:
 *   node scripts/create-admin-quick.mjs admin@cardmass.com "Admin User" admin123 super-admin
 */

import { MongoClient } from 'mongodb';
import crypto from 'crypto';
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

async function main() {
  console.log('🔐 CardMass Admin User Creation (Quick)\n');

  // WHAT: Parse command-line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node scripts/create-admin-quick.mjs <email> <name> <password> [role]');
    console.error('Example: node scripts/create-admin-quick.mjs admin@cardmass.com "Admin User" admin123 super-admin');
    process.exit(1);
  }

  const email = args[0].trim().toLowerCase();
  const name = args[1].trim();
  const password = args[2].trim();
  const role = args[3] ? args[3].trim().toLowerCase() : 'admin';

  // WHAT: Validate role
  if (role !== 'admin' && role !== 'super-admin') {
    console.error('❌ Error: Role must be either "admin" or "super-admin"');
    process.exit(1);
  }

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

    // WHAT: Validate input
    if (!email || !name || !password) {
      console.error('❌ Error: All fields are required.');
      process.exit(1);
    }

    if (!email.includes('@')) {
      console.error('❌ Error: Invalid email format.');
      process.exit(1);
    }

    // WHAT: Check if user already exists
    const existing = await usersCol.findOne({ email });
    if (existing) {
      console.error(`❌ Error: User with email "${email}" already exists.`);
      console.error(`   User ID: ${existing._id}`);
      console.error(`   Name: ${existing.name}`);
      console.error(`   Role: ${existing.role}`);
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

    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: ${role}`);
    console.log(`   Password: <hashed with MD5>\n`);
    console.log('💡 You can now login at http://localhost:3000/admin/login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
