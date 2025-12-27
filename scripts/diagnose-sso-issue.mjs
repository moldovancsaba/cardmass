#!/usr/bin/env node
/**
 * SSO Authentication Issue Diagnostic Script
 * 
 * WHAT: Diagnoses SSO authentication failures by checking configuration and testing the flow
 * WHY: Help identify root cause of "Authentication failed" errors
 * 
 * Usage: node scripts/diagnose-sso-issue.mjs [email]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Load environment variables
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

async function diagnose() {
  console.log('🔍 SSO Authentication Diagnostic Tool\n')
  console.log('='.repeat(60))
  
  const env = loadEnv()
  const email = process.argv[2] || 'moldovancsaba@gmail.com'
  
  // Check environment variables
  console.log('\n1. Environment Variables Check:')
  console.log('─'.repeat(60))
  const requiredVars = ['SSO_BASE_URL', 'SSO_CLIENT_ID', 'SSO_CLIENT_SECRET', 'SSO_REDIRECT_URI']
  let envOk = true
  
  for (const varName of requiredVars) {
    const value = env[varName]
    if (!value || value.trim() === '') {
      console.error(`❌ ${varName}: MISSING`)
      envOk = false
    } else {
      const displayValue = varName.includes('SECRET') 
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        : value
      console.log(`✅ ${varName}: ${displayValue}`)
    }
  }
  
  if (!envOk) {
    console.log('\n❌ Environment variables are missing. Fix this first.')
    process.exit(1)
  }
  
  // Check redirect URI format
  console.log('\n2. Redirect URI Analysis:')
  console.log('─'.repeat(60))
  const redirectUri = env.SSO_REDIRECT_URI
  console.log(`Current: ${redirectUri}`)
  
  const uri = new URL(redirectUri)
  console.log(`  Protocol: ${uri.protocol}`)
  console.log(`  Host: ${uri.host}`)
  console.log(`  Path: ${uri.pathname}`)
  
  // Check if it matches expected patterns
  const expectedPatterns = [
    /^https?:\/\/localhost:\d+\/api\/auth\/(sso\/)?callback$/,
    /^https:\/\/cardmass\.doneisbetter\.com\/api\/auth\/(sso\/)?callback$/,
  ]
  
  const matchesPattern = expectedPatterns.some(pattern => pattern.test(redirectUri))
  if (!matchesPattern) {
    console.warn(`⚠️  Redirect URI format may be incorrect`)
  } else {
    console.log(`✅ Redirect URI format is valid`)
  }
  
  // Check SSO service
  console.log('\n3. SSO Service Check:')
  console.log('─'.repeat(60))
  const ssoBaseUrl = env.SSO_BASE_URL
  console.log(`SSO Base URL: ${ssoBaseUrl}`)
  
  try {
    // Check JWKS endpoint
    const jwksUrl = `${ssoBaseUrl}/.well-known/jwks.json`
    console.log(`Checking JWKS endpoint: ${jwksUrl}`)
    const jwksResponse = await fetch(jwksUrl)
    if (jwksResponse.ok) {
      console.log('✅ JWKS endpoint is accessible')
    } else {
      console.error(`❌ JWKS endpoint returned ${jwksResponse.status}`)
    }
    
    // Check OAuth authorize endpoint
    const authorizeUrl = `${ssoBaseUrl}/api/oauth/authorize`
    console.log(`Checking authorize endpoint: ${authorizeUrl}`)
    const authResponse = await fetch(authorizeUrl, { method: 'GET', redirect: 'manual' })
    if (authResponse.status === 302 || authResponse.status === 400) {
      console.log('✅ Authorize endpoint is accessible')
    } else {
      console.warn(`⚠️  Authorize endpoint returned ${authResponse.status}`)
    }
  } catch (error) {
    console.error(`❌ Failed to connect to SSO service: ${error.message}`)
  }
  
  // Check user permissions
  console.log('\n4. User Permission Check:')
  console.log('─'.repeat(60))
  console.log(`Email: ${email}`)
  console.log(`\nTo check user permissions, you need to:`)
  console.log(`1. Log into SSO admin: ${ssoBaseUrl}/admin`)
  console.log(`2. Find user: ${email}`)
  console.log(`3. Check app permissions for CardMass (client ID: ${env.SSO_CLIENT_ID})`)
  console.log(`4. Ensure permission status is "approved" and role is "user", "admin", or "owner"`)
  
  // Redirect URI mismatch check
  console.log('\n5. Redirect URI Mismatch Check:')
  console.log('─'.repeat(60))
  console.log(`⚠️  CRITICAL: The redirect URI in SSO must EXACTLY match what's in .env.local`)
  console.log(`\nCurrent redirect URI: ${redirectUri}`)
  console.log(`\nThis URI must be registered in SSO OAuth client settings.`)
  console.log(`\nTo fix:`)
  console.log(`1. Go to ${ssoBaseUrl}/admin/oauth-clients`)
  console.log(`2. Find CardMass client (ID: ${env.SSO_CLIENT_ID})`)
  console.log(`3. Ensure redirect_uris includes: ${redirectUri}`)
  console.log(`4. Also add these for compatibility:`)
  console.log(`   - ${redirectUri.replace('/sso/callback', '/callback')}`)
  console.log(`   - ${redirectUri.replace('localhost:3000', 'localhost:6000')}`)
  console.log(`   - ${redirectUri.replace('localhost:3000', 'localhost:6000').replace('/sso/callback', '/callback')}`)
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 Summary:')
  console.log('─'.repeat(60))
  console.log('Most common issues:')
  console.log('1. Redirect URI mismatch between .env.local and SSO client settings')
  console.log('2. User permissions not set or status is "pending"')
  console.log('3. SSO_CLIENT_ID or SSO_CLIENT_SECRET incorrect')
  console.log('4. Network/firewall blocking connection to SSO service')
  console.log('\nNext steps:')
  console.log('1. Verify redirect URI in SSO admin panel matches .env.local')
  console.log('2. Check user permissions in SSO admin panel')
  console.log('3. Check server logs for detailed error messages')
  console.log('4. Test with: npm run sso:check:vercel')
}

diagnose().catch(error => {
  console.error('❌ Diagnostic failed:', error)
  process.exit(1)
})

