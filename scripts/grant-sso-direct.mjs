#!/usr/bin/env node
/**
 * WHAT: Grant SSO superadmin access directly via database
 * WHY: Bypass SSO admin API when admin cookie isn't available
 * 
 * Usage:
 *   node scripts/grant-sso-direct.mjs <email>
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID;
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node scripts/grant-sso-direct.mjs <email>');
  console.error('   Example: node scripts/grant-sso-direct.mjs moldovancsaba@gmail.com');
  process.exit(1);
}

if (!SSO_CLIENT_ID) {
  console.error('❌ SSO_CLIENT_ID not found in .env.local');
  process.exit(1);
}

// WHAT: SSO database connection
// WHY: Need to connect to the SSO MongoDB to grant app permissions
const SSO_MONGODB_URI = 'mongodb+srv://thanperfect:CuW54NNNFKnGQtt6@doneisbetter.49s2z.mongodb.net/?retryWrites=true&w=majority&appName=doneisbetter';
const SSO_DB_NAME = 'sso';

async function grantDirectAccess() {
  console.log('🔐 Grant SSO Superadmin Access (Direct DB)\n');
  console.log(`Target email: ${email}`);
  console.log(`App: CardMass (${SSO_CLIENT_ID})`);
  console.log(`Role: superadmin\n`);
  
  console.log('📊 Connecting to SSO database...\n');
  const client = new MongoClient(SSO_MONGODB_URI);
  await client.connect();
  const db = client.db(SSO_DB_NAME);
  
  // WHAT: Find user by email
  const usersCol = db.collection('users');
  const user = await usersCol.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    console.error(`❌ User not found in SSO: ${email}`);
    console.error(`\nThe user needs to sign up at SSO first.`);
    await client.close();
    process.exit(1);
  }
  
  console.log(`✅ Found SSO user: ${user.name} (${user.id})\n`);
  
  // WHAT: Grant or update app permission
  const permissionsCol = db.collection('appPermissions');
  
  const existingPermission = await permissionsCol.findOne({
    userId: user.id,
    appId: SSO_CLIENT_ID,
  });
  
  if (existingPermission) {
    console.log('📝 Updating existing permission...');
    await permissionsCol.updateOne(
      { userId: user.id, appId: SSO_CLIENT_ID },
      {
        $set: {
          status: 'approved',
          role: 'superadmin',
          updatedAt: new Date().toISOString(),
        }
      }
    );
    console.log('✅ Permission updated to SUPERADMIN');
  } else {
    console.log('📝 Creating new permission...');
    await permissionsCol.insertOne({
      userId: user.id,
      appId: SSO_CLIENT_ID,
      status: 'approved',
      role: 'superadmin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Permission created with SUPERADMIN role');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCCESS!');
  console.log('='.repeat(60));
  console.log(`\n${email} now has SUPERADMIN access to CardMass via SSO`);
  console.log('\nNext steps:');
  console.log('  1. Go to http://localhost:3000');
  console.log('  2. Click "Sign in with SSO"');
  console.log('  3. Login with your Google account\n');
  
  await client.close();
}

grantDirectAccess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });
