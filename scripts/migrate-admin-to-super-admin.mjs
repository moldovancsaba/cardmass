#!/usr/bin/env node
/**
 * WHAT: Migrate existing admin users to super-admin role
 * WHY: Support new multi-tenant access control system
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DBNAME = process.env.MONGODB_DBNAME || 'cardmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function migrateAdminUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DBNAME);
    const usersCol = db.collection('users');

    // Find all users with role 'admin'
    const adminUsers = await usersCol.find({ role: 'admin' }).toArray();

    if (adminUsers.length === 0) {
      console.log('✅ No admin users found (already migrated or using super-admin)');
      return;
    }

    console.log(`\n📊 Found ${adminUsers.length} admin user(s) to migrate:\n`);

    for (const user of adminUsers) {
      console.log(`  - ${user.email} (${user.name})`);
    }

    console.log('\n🔄 Migrating to super-admin role...\n');

    // Update all admin users to super-admin
    const result = await usersCol.updateMany(
      { role: 'admin' },
      {
        $set: {
          role: 'super-admin',
          organizationAccess: [],
          updatedAt: new Date().toISOString(),
        },
      }
    );

    console.log(`✅ Successfully migrated ${result.modifiedCount} user(s)`);
    console.log('\n📋 Migration complete:');
    console.log(`   - Role changed from 'admin' to 'super-admin'`);
    console.log(`   - organizationAccess array initialized`);
    console.log(`   - These users now have global access to all organizations`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrateAdminUsers();
