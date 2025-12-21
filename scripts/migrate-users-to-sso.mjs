#!/usr/bin/env node
/**
 * WHAT: Migrate CardMass Users to SSO
 * WHY: Sync existing users into SSO system for centralized permission management
 * 
 * Usage:
 *   DRY_RUN=1 node scripts/migrate-users-to-sso.mjs
 *   node scripts/migrate-users-to-sso.mjs --execute
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const SSO_BASE_URL = process.env.SSO_BASE_URL || 'https://sso.doneisbetter.com';
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DBNAME = process.env.MONGODB_DBNAME || 'cardmass';

const DRY_RUN = process.env.DRY_RUN === '1' || !process.argv.includes('--execute');

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

// WHAT: Map CardMass roles to SSO app roles
// WHY: Different naming conventions between systems
function mapRoleToSSO(cardmassUser) {
  // WHAT: super-admin → superadmin
  if (cardmassUser.role === 'super-admin') {
    return 'superadmin';
  }
  
  // WHAT: user with organizationAccess → determine by org role
  if (cardmassUser.role === 'user' && cardmassUser.organizationAccess?.length > 0) {
    // WHAT: If user is org-admin in any org, make them admin in CardMass
    const hasOrgAdmin = cardmassUser.organizationAccess.some(
      (access) => access.role === 'org-admin'
    );
    return hasOrgAdmin ? 'admin' : 'user';
  }
  
  // WHAT: Default to user role
  return 'user';
}

// WHAT: Create user in SSO (if not exists)
async function createSSOUser(user, ssoAdminCookie) {
  console.log(`  → Creating SSO user: ${user.email}`);
  
  const response = await fetch(`${SSO_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': ssoAdminCookie,
    },
    body: JSON.stringify({
      email: user.email,
      name: user.name,
      // WHAT: Don't send password; SSO will generate one or use magic link
      sendMagicLink: true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    // WHAT: If user already exists, that's okay
    if (error.includes('already exists') || response.status === 409) {
      console.log(`  ℹ  User already exists in SSO`);
      return { exists: true };
    }
    throw new Error(`Failed to create SSO user: ${response.status} ${error}`);
  }
  
  const result = await response.json();
  console.log(`  ✅ Created SSO user: ${result.user?.id || result.userId}`);
  return result;
}

// WHAT: Get SSO user ID by email
async function getSSOUserId(email, ssoAdminCookie) {
  const response = await fetch(
    `${SSO_BASE_URL}/api/admin/users/search?email=${encodeURIComponent(email)}`,
    {
      headers: {
        'Cookie': ssoAdminCookie,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to search SSO user: ${response.status}`);
  }
  
  const result = await response.json();
  return result.user?.id || result.userId;
}

// WHAT: Grant CardMass app permission to user
async function grantAppPermission(ssoUserId, appRole, ssoAdminCookie) {
  console.log(`  → Granting CardMass ${appRole} permission...`);
  
  const response = await fetch(
    `${SSO_BASE_URL}/api/admin/users/${ssoUserId}/apps/${SSO_CLIENT_ID}/permissions`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': ssoAdminCookie,
      },
      body: JSON.stringify({
        status: 'approved',
        role: appRole,
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to grant permission: ${response.status} ${error}`);
  }
  
  const result = await response.json();
  console.log(`  ✅ Granted ${appRole} access`);
  return result;
}

// WHAT: Main migration logic
async function migrateUsers() {
  console.log('🔄 CardMass → SSO User Migration\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '✍️  EXECUTE (will apply changes)'}\n`);
  
  // WHAT: Validate environment
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }
  if (!SSO_CLIENT_ID) {
    console.error('❌ SSO_CLIENT_ID not found in .env.local');
    process.exit(1);
  }
  
  // WHAT: Get SSO admin credentials
  console.log('🔐 SSO Admin Authentication\n');
  console.log('You need an SSO admin session cookie to create users and grant permissions.');
  console.log('To get your session cookie:');
  console.log('  1. Login to https://sso.doneisbetter.com/admin');
  console.log('  2. Open browser DevTools → Application → Cookies');
  console.log('  3. Copy the "admin_session" cookie value\n');
  
  const ssoAdminCookie = await prompt('Paste your SSO admin_session cookie value: ');
  if (!ssoAdminCookie) {
    console.error('❌ Admin cookie required');
    process.exit(1);
  }
  
  console.log('\n📊 Connecting to CardMass MongoDB...\n');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DBNAME);
  
  // WHAT: Read all CardMass users
  const users = await db.collection('users').find({}).toArray();
  console.log(`Found ${users.length} CardMass users\n`);
  
  if (users.length === 0) {
    console.log('No users to migrate');
    await client.close();
    return;
  }
  
  // WHAT: Migrate each user
  const results = {
    success: [],
    failed: [],
    skipped: [],
  };
  
  for (const user of users) {
    console.log(`\n👤 Processing: ${user.email} (${user.name})`);
    console.log(`   CardMass role: ${user.role}`);
    
    const ssoAppRole = mapRoleToSSO(user);
    console.log(`   SSO app role: ${ssoAppRole}`);
    
    if (DRY_RUN) {
      console.log('   [DRY RUN] Would create SSO user and grant permission');
      results.skipped.push(user.email);
      continue;
    }
    
    try {
      // WHAT: Create SSO user (if not exists)
      const createResult = await createSSOUser(user, `admin_session=${ssoAdminCookie}`);
      
      // WHAT: Get SSO user ID
      const ssoUserId = createResult.user?.id || 
                        createResult.userId || 
                        (await getSSOUserId(user.email, `admin_session=${ssoAdminCookie}`));
      
      if (!ssoUserId) {
        throw new Error('Could not determine SSO user ID');
      }
      
      // WHAT: Grant CardMass app permission
      await grantAppPermission(ssoUserId, ssoAppRole, `admin_session=${ssoAdminCookie}`);
      
      console.log(`  ✅ Successfully migrated ${user.email}`);
      results.success.push(user.email);
    } catch (error) {
      console.error(`  ❌ Failed to migrate ${user.email}:`, error.message);
      results.failed.push({ email: user.email, error: error.message });
    }
  }
  
  await client.close();
  
  // WHAT: Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed:  ${results.failed.length}`);
  console.log(`⏭  Skipped: ${results.skipped.length} (dry run)`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed migrations:');
    results.failed.forEach(({ email, error }) => {
      console.log(`   - ${email}: ${error}`);
    });
  }
  
  if (DRY_RUN) {
    console.log('\n💡 This was a dry run. To apply changes, run:');
    console.log('   node scripts/migrate-users-to-sso.mjs --execute');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('  1. Verify users in SSO admin: https://sso.doneisbetter.com/admin/users');
    console.log('  2. Check app permissions for CardMass');
    console.log('  3. Test SSO login for migrated users');
  }
}

// WHAT: Run migration
migrateUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
