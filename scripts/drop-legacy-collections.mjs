#!/usr/bin/env node
/**
 * WHAT: Drop legacy authentication collections from MongoDB
 * WHY: Remove empty users and sessions collections after SSO migration
 * 
 * Usage:
 *   node scripts/drop-legacy-collections.mjs
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DBNAME = process.env.MONGODB_DBNAME || 'cardmass';

async function dropLegacyCollections() {
  console.log('🗑️  Drop Legacy Collections\n');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }
  
  console.log('📊 Connecting to MongoDB...\n');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DBNAME);
  
  // WHAT: List all collections
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  console.log(`📋 Current collections: ${collectionNames.join(', ')}\n`);
  
  // WHAT: Drop users collection if exists
  if (collectionNames.includes('users')) {
    const count = await db.collection('users').countDocuments();
    console.log(`🗑️  Dropping 'users' collection (${count} documents)...`);
    await db.collection('users').drop();
    console.log('✅ Dropped users collection');
  } else {
    console.log('ℹ️  users collection does not exist (already dropped)');
  }
  
  // WHAT: Drop sessions collection if exists
  if (collectionNames.includes('sessions')) {
    const count = await db.collection('sessions').countDocuments();
    console.log(`🗑️  Dropping 'sessions' collection (${count} documents)...`);
    await db.collection('sessions').drop();
    console.log('✅ Dropped sessions collection');
  } else {
    console.log('ℹ️  sessions collection does not exist (already dropped)');
  }
  
  // WHAT: List remaining collections
  const remaining = await db.listCollections().toArray();
  const remainingNames = remaining.map(c => c.name);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ CLEANUP COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📋 Remaining collections: ${remainingNames.join(', ')}\n`);
  console.log('CardMass is now using SSO authentication exclusively.\n');
  
  await client.close();
}

// WHAT: Run cleanup
dropLegacyCollections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
