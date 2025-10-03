#!/usr/bin/env node
/**
 * WHAT: Ensure all users have organizationAccess field
 * WHY: Required for new multi-tenant system
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DBNAME = process.env.MONGODB_DBNAME || 'cardmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function ensureOrgAccessField() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DBNAME);
    const usersCol = db.collection('users');

    // Find users without organizationAccess field
    const usersWithoutField = await usersCol.find({
      organizationAccess: { $exists: false }
    }).toArray();

    if (usersWithoutField.length === 0) {
      console.log('✅ All users already have organizationAccess field');
      return;
    }

    console.log(`📊 Found ${usersWithoutField.length} user(s) without organizationAccess:\n`);
    
    for (const user of usersWithoutField) {
      console.log(`  - ${user.email} (${user.role})`);
    }

    console.log('\n🔄 Adding organizationAccess field...\n');

    // Add organizationAccess field to all users without it
    const result = await usersCol.updateMany(
      { organizationAccess: { $exists: false } },
      {
        $set: {
          organizationAccess: [],
          updatedAt: new Date().toISOString(),
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} user(s)`);
    console.log(`   - Added empty organizationAccess array`);
    console.log(`   - Super-admins have access to all orgs by default`);
    console.log(`   - Regular users need explicit org access grants`);

  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

ensureOrgAccessField();
