/**
 * debug-users.mjs
 * 
 * WHAT: Debug script to inspect users collection and test password hashing.
 * WHY: Troubleshoot login issues.
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
  console.error('Could not load .env.local');
}

// WHAT: Hash password using MD5 (matches auth.ts implementation)
function hashPassword(plaintext) {
  return crypto.createHash('md5').update(plaintext).digest('hex');
}

async function main() {
  console.log('🔍 CardMass Users Debug\n');

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DBNAME || 'cardmass';

  if (!uri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db(dbName);
    const usersCol = db.collection('users');

    // WHAT: List all users
    const users = await usersCol.find({}).toArray();
    
    console.log(`Found ${users.length} user(s):\n`);
    
    for (const user of users) {
      console.log('User:');
      console.log(`  ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Password Hash: ${user.password}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log();

      // WHAT: Test password hashing
      const testPassword = 'admin123';
      const testHash = hashPassword(testPassword);
      console.log(`  Test: hashPassword("${testPassword}") = ${testHash}`);
      console.log(`  Match: ${testHash === user.password ? '✅ YES' : '❌ NO'}`);
      console.log();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
