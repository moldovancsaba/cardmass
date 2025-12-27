#!/usr/bin/env node
/**
 * SSO Authentication Debug Script
 * 
 * WHAT: Comprehensive diagnostic tool to find root cause of SSO auth failures
 * WHY: "Authentication failed" is too generic; need to identify exact failure point
 * 
 * Usage: node scripts/debug-sso-auth.mjs [email]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function loadEnv() {
  const envPath = path.join(rootDir, '.env.local')
  if (!fs.existsSync(envPath)) {
    return {}
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const [, key, value] = match
      env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
    }
  }
  
  return env
}

async function testJWKSEndpoint(ssoBaseUrl) {
  console.log('\n1. Testing JWKS Endpoints:')
  console.log('─'.repeat(60))
  
  const endpoints = [
    `${ssoBaseUrl}/.well-known/jwks.json`,
    `${ssoBaseUrl}/api/.well-known/jwks.json`,
  ]
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${endpoint}`)
        console.log(`   Keys: ${data.keys?.length || 0}`)
        if (data.keys?.[0]) {
          console.log(`   Key ID: ${data.keys[0].kid}`)
          console.log(`   Algorithm: ${data.keys[0].alg}`)
        }
      } else {
        console.log(`❌ ${endpoint}`)
        console.log(`   Status: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint}`)
      console.log(`   Error: ${error.message}`)
    }
  }
}

async function testTokenEndpoint(ssoBaseUrl, clientId, clientSecret, redirectUri) {
  console.log('\n2. Testing Token Endpoint:')
  console.log('─'.repeat(60))
  
  const tokenUrl = `${ssoBaseUrl}/api/oauth/token`
  console.log(`Endpoint: ${tokenUrl}`)
  console.log(`Client ID: ${clientId}`)
  console.log(`Redirect URI: ${redirectUri}`)
  console.log(`Client Secret: ${clientSecret ? '***SET***' : '***NOT SET***'}`)
  
  // Test with invalid code (should return error, but endpoint should be accessible)
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: 'test-invalid-code',
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: 'test',
      }),
    })
    
    const data = await response.json().catch(() => ({}))
    
    if (response.status === 400 && data.error) {
      console.log(`✅ Token endpoint is accessible`)
      console.log(`   Expected error for invalid code: ${data.error}`)
    } else {
      console.log(`⚠️  Token endpoint returned: ${response.status}`)
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`)
    }
  } catch (error) {
    console.log(`❌ Token endpoint error: ${error.message}`)
  }
}

async function testPermissionsEndpoint(ssoBaseUrl, clientId, email) {
  console.log('\n3. Testing Permissions Endpoint:')
  console.log('─'.repeat(60))
  console.log(`Note: This requires a valid access token`)
  console.log(`To test manually:`)
  console.log(`1. Complete OAuth flow to get access token`)
  console.log(`2. Call: ${ssoBaseUrl}/api/users/{userId}/apps/${clientId}/permissions`)
  console.log(`3. Check if user ${email} has permission record in SSO`)
}

async function checkUserInSSO(ssoBaseUrl, email) {
  console.log('\n4. User Existence Check:')
  console.log('─'.repeat(60))
  console.log(`Email: ${email}`)
  console.log(`\nTo check if user exists in SSO:`)
  console.log(`1. Go to ${ssoBaseUrl}/admin`)
  console.log(`2. Search for user: ${email}`)
  console.log(`3. Check if user exists in:`)
  console.log(`   - users collection (admin users)`)
  console.log(`   - publicUsers collection (public users)`)
  console.log(`4. Verify user has UUID (id field)`)
}

async function checkUserPermission(ssoBaseUrl, clientId, email) {
  console.log('\n5. User Permission Check:')
  console.log('─'.repeat(60))
  console.log(`Email: ${email}`)
  console.log(`Client ID: ${clientId}`)
  console.log(`\nTo check user permissions:`)
  console.log(`1. Go to ${ssoBaseUrl}/admin`)
  console.log(`2. Find user: ${email}`)
  console.log(`3. Check "Apps" tab or "Permissions" section`)
  console.log(`4. Look for CardMass app (client ID: ${clientId})`)
  console.log(`5. Verify:`)
  console.log(`   - Status is 'active' or 'approved'`)
  console.log(`   - Role is 'user', 'admin', or 'owner'`)
  console.log(`   - hasAccess is true`)
}

async function diagnose() {
  console.log('🔍 SSO Authentication Root Cause Diagnostic\n')
  console.log('='.repeat(60))
  
  const env = loadEnv()
  const email = process.argv[2] || 'moldovancsaba@gmail.com'
  const ssoBaseUrl = env.SSO_BASE_URL || 'https://sso.doneisbetter.com'
  const clientId = env.SSO_CLIENT_ID
  const clientSecret = env.SSO_CLIENT_SECRET
  const redirectUri = env.SSO_REDIRECT_URI
  
  if (!clientId || !clientSecret || !redirectUri) {
    console.error('❌ Missing SSO configuration')
    console.error('Required: SSO_CLIENT_ID, SSO_CLIENT_SECRET, SSO_REDIRECT_URI')
    process.exit(1)
  }
  
  console.log(`\n📋 Configuration:`)
  console.log(`   SSO Base URL: ${ssoBaseUrl}`)
  console.log(`   Client ID: ${clientId}`)
  console.log(`   Redirect URI: ${redirectUri}`)
  console.log(`   Email: ${email}`)
  
  await testJWKSEndpoint(ssoBaseUrl)
  await testTokenEndpoint(ssoBaseUrl, clientId, clientSecret, redirectUri)
  await testPermissionsEndpoint(ssoBaseUrl, clientId, email)
  await checkUserInSSO(ssoBaseUrl, email)
  await checkUserPermission(ssoBaseUrl, clientId, email)
  
  console.log('\n' + '='.repeat(60))
  console.log('📋 Common Root Causes:')
  console.log('─'.repeat(60))
  console.log('1. JWKS endpoint not accessible (404)')
  console.log('   → Fix: Deploy SSO rewrite rule or use /api/.well-known/jwks.json')
  console.log('')
  console.log('2. User not found in SSO database')
  console.log('   → Fix: User must exist in SSO users or publicUsers collection')
  console.log('   → Note: CardMass users collection is SEPARATE from SSO')
  console.log('')
  console.log('3. User has no permission record')
  console.log('   → Fix: Grant permission in SSO admin panel')
  console.log('   → Status must be "active" or "approved"')
  console.log('')
  console.log('4. Permission status mismatch')
  console.log('   → Fix: Ensure status is "active" (SSO internal) or "approved" (API)')
  console.log('')
  console.log('5. Redirect URI mismatch')
  console.log('   → Fix: Ensure redirect URI in .env.local matches SSO client settings')
  console.log('')
  console.log('6. Token verification failure')
  console.log('   → Fix: Check JWKS endpoint, token signature, issuer, audience')
  console.log('')
  console.log('💡 Next Steps:')
  console.log('   1. Check server logs for detailed error messages')
  console.log('   2. Test OAuth flow and watch console logs')
  console.log('   3. Verify user exists in SSO and has permissions')
  console.log('   4. Check JWKS endpoint accessibility')
}

diagnose().catch(error => {
  console.error('❌ Diagnostic failed:', error)
  process.exit(1)
})

