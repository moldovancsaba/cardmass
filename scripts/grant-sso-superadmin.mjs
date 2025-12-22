#!/usr/bin/env node
/**
 * WHAT: Grant SSO Superadmin Access to User
 * WHY: Quickly grant highest-level access to CardMass via SSO
 * 
 * Usage:
 *   node scripts/grant-sso-superadmin.mjs <email>
 *   node scripts/grant-sso-superadmin.mjs moldovancsaba@gmail.com
 */

import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const SSO_BASE_URL = process.env.SSO_BASE_URL || 'https://sso.doneisbetter.com';
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID;

// WHAT: Get command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node scripts/grant-sso-superadmin.mjs <email>');
  console.error('   Example: node scripts/grant-sso-superadmin.mjs moldovancsaba@gmail.com');
  process.exit(1);
}

if (!SSO_CLIENT_ID) {
  console.error('❌ SSO_CLIENT_ID not found in .env.local');
  process.exit(1);
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

// WHAT: Get SSO user ID by email
async function getSSOUserId(email, ssoAdminCookie) {
  console.log(`🔍 Searching for SSO user: ${email}...`);
  
  const response = await fetch(
    `${SSO_BASE_URL}/api/admin/users/search?email=${encodeURIComponent(email)}`,
    {
      headers: {
        'Cookie': ssoAdminCookie,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to search SSO user: ${response.status} ${await response.text()}`);
  }
  
  const result = await response.json();
  
  if (!result.user && !result.userId) {
    throw new Error(`User not found in SSO: ${email}\n\nThe user needs to log into SSO first at ${SSO_BASE_URL}/login`);
  }
  
  const userId = result.user?.id || result.userId;
  console.log(`✅ Found SSO user ID: ${userId}`);
  return userId;
}

// WHAT: Grant CardMass superadmin permission
async function grantSuperadminPermission(ssoUserId, ssoAdminCookie) {
  console.log(`🔐 Granting CardMass SUPERADMIN permission...`);
  
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
        role: 'superadmin',
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to grant permission: ${response.status} ${error}`);
  }
  
  const result = await response.json();
  console.log(`✅ Successfully granted SUPERADMIN access!`);
  return result;
}

// WHAT: Main execution
async function grantAccess() {
  console.log('🔐 Grant SSO Superadmin Access\n');
  console.log(`Target email: ${email}`);
  console.log(`App: CardMass (${SSO_CLIENT_ID})`);
  console.log(`Role: superadmin (highest level)\n`);
  
  // WHAT: Get SSO admin credentials
  console.log('You need an SSO admin session cookie to grant permissions.');
  console.log('To get your session cookie:');
  console.log(`  1. Login to ${SSO_BASE_URL}/admin`);
  console.log('  2. Open browser DevTools → Application → Cookies');
  console.log('  3. Copy the "admin_session" cookie value\n');
  
  const ssoAdminCookie = await prompt('Paste your SSO admin_session cookie value: ');
  if (!ssoAdminCookie) {
    console.error('❌ Admin cookie required');
    process.exit(1);
  }
  
  console.log('');
  
  try {
    // WHAT: Get SSO user ID
    const ssoUserId = await getSSOUserId(email, `admin_session=${ssoAdminCookie}`);
    
    // WHAT: Grant superadmin permission
    await grantSuperadminPermission(ssoUserId, `admin_session=${ssoAdminCookie}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS!');
    console.log('='.repeat(60));
    console.log(`\n${email} now has SUPERADMIN access to CardMass via SSO`);
    console.log('\nNext steps:');
    console.log('  1. User can now login at: http://localhost:3000');
    console.log('  2. Or production: https://cardmass.doneisbetter.com');
    console.log('  3. Verify permissions in SSO admin panel\n');
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

// WHAT: Run script
grantAccess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
