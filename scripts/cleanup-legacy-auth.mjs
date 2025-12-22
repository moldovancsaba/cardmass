#!/usr/bin/env node
/**
 * WHAT: Clean Up Legacy Authentication Data
 * WHY: Remove old users/sessions after migrating to SSO
 * 
 * Usage:
 *   DRY_RUN=1 node scripts/cleanup-legacy-auth.mjs (preview only)
 *   node scripts/cleanup-legacy-auth.mjs --execute (actually delete)
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DBNAME = process.env.MONGODB_DBNAME || 'cardmass';
const DRY_RUN = process.env.DRY_RUN === '1' || !process.argv.includes('--execute');

// WHAT: Prompt user for confirmation
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

async function cleanupLegacyAuth() {
  console.log('🧹 Legacy Authentication Cleanup\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (preview only)' : '⚠️  EXECUTE (will delete data!)' }\n`);
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }
  
  console.log('📊 Connecting to MongoDB...\n');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DBNAME);
  
  // WHAT: Count documents in legacy collections
  const usersCount = await db.collection('users').countDocuments();
  const sessionsCount = await db.collection('sessions').countDocuments();
  const ssoSessionsCount = await db.collection('ssoSessions').countDocuments();
  
  console.log('📋 Current State:');
  console.log(`  - Legacy users: ${usersCount}`);
  console.log(`  - Legacy sessions: ${sessionsCount}`);
  console.log(`  - SSO sessions: ${ssoSessionsCount} (will NOT be deleted)\n`);
  
  if (usersCount === 0 && sessionsCount === 0) {
    console.log('✅ No legacy data to clean up. All good!');
    await client.close();
    return;
  }
  
  // WHAT: Show what will be deleted
  if (usersCount > 0) {
    console.log('👥 Legacy Users to be deleted:');
    const users = await db.collection('users').find({}).toArray();
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Role: ${user.role}`);
    });
    console.log('');
  }
  
  if (!DRY_RUN) {
    // WHAT: Final confirmation
    console.log('⚠️  WARNING: This will permanently delete:');
    console.log(`  - ${usersCount} legacy user(s)`);
    console.log(`  - ${sessionsCount} legacy session(s)`);
    console.log('\n❗ This action CANNOT be undone!');
    console.log('💡 SSO sessions will NOT be affected.\n');
    
    const confirmation = await prompt('Type "DELETE" to confirm: ');
    
    if (confirmation !== 'DELETE') {
      console.log('\n❌ Cleanup cancelled. No data was deleted.');
      await client.close();
      return;
    }
    
    console.log('\n🗑️  Deleting legacy authentication data...\n');
    
    // WHAT: Delete legacy users
    if (usersCount > 0) {
      const usersResult = await db.collection('users').deleteMany({});
      console.log(`✅ Deleted ${usersResult.deletedCount} legacy users`);
    }
    
    // WHAT: Delete legacy sessions
    if (sessionsCount > 0) {
      const sessionsResult = await db.collection('sessions').deleteMany({});
      console.log(`✅ Deleted ${sessionsResult.deletedCount} legacy sessions`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nLegacy authentication data has been removed.');
    console.log('CardMass now uses SSO exclusively.\n');
    console.log('📊 Final State:');
    console.log(`  - Legacy users: 0`);
    console.log(`  - Legacy sessions: 0`);
    console.log(`  - SSO sessions: ${ssoSessionsCount} ✓\n`);
  } else {
    console.log('💡 This is a DRY RUN. No data was deleted.');
    console.log('\nTo actually delete the data, run:');
    console.log('  node scripts/cleanup-legacy-auth.mjs --execute\n');
  }
  
  await client.close();
}

// WHAT: Run cleanup
cleanupLegacyAuth()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
