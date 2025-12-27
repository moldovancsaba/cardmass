#!/usr/bin/env node
/**
 * Update SSO OAuth Client Redirect URIs
 * 
 * WHAT: Updates CardMass OAuth client redirect URIs in SSO via admin API
 * WHY: Fix redirect URI mismatch that causes "Authentication failed" errors
 * 
 * Usage: 
 *   node scripts/update-sso-redirect-uris.mjs [admin-email] [admin-password]
 * 
 * Or set SSO_ADMIN_EMAIL and SSO_ADMIN_PASSWORD in .env.local
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

async function loginToSSO(ssoBaseUrl, email, password) {
  try {
    const response = await fetch(`${ssoBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Login failed: ${error.error_description || response.statusText}`)
    }
    
    // Extract session cookie
    const cookies = response.headers.get('set-cookie')
    if (!cookies) {
      throw new Error('No session cookie received')
    }
    
    // Extract session token from cookie
    const sessionMatch = cookies.match(/(?:^|;\s*)admin-session=([^;]+)/)
    if (!sessionMatch) {
      throw new Error('Session cookie not found in response')
    }
    
    return sessionMatch[1]
  } catch (error) {
    throw new Error(`SSO login failed: ${error.message}`)
  }
}

async function getClient(ssoBaseUrl, clientId, sessionToken) {
  try {
    const response = await fetch(`${ssoBaseUrl}/api/admin/oauth-clients/${clientId}`, {
      headers: {
        'Cookie': `admin-session=${sessionToken}`,
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Failed to get client: ${error.error || response.statusText}`)
    }
    
    const data = await response.json()
    return data.client
  } catch (error) {
    throw new Error(`Failed to get client: ${error.message}`)
  }
}

async function updateClient(ssoBaseUrl, clientId, redirectUris, sessionToken) {
  try {
    const response = await fetch(`${ssoBaseUrl}/api/admin/oauth-clients/${clientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin-session=${sessionToken}`,
      },
      body: JSON.stringify({
        redirect_uris: redirectUris,
      }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Failed to update client: ${error.error || error.message || response.statusText}`)
    }
    
    const data = await response.json()
    return data.client
  } catch (error) {
    throw new Error(`Failed to update client: ${error.message}`)
  }
}

async function main() {
  console.log('🔧 SSO Redirect URI Updater\n')
  console.log('='.repeat(60))
  
  const env = loadEnv()
  const clientId = env.SSO_CLIENT_ID
  const ssoBaseUrl = env.SSO_BASE_URL || 'https://sso.doneisbetter.com'
  const redirectUri = env.SSO_REDIRECT_URI
  
  if (!clientId || !redirectUri) {
    console.error('❌ SSO_CLIENT_ID or SSO_REDIRECT_URI not found in .env.local')
    process.exit(1)
  }
  
  // Get admin credentials
  const adminEmail = process.argv[2] || env.SSO_ADMIN_EMAIL
  const adminPassword = process.argv[3] || env.SSO_ADMIN_PASSWORD
  
  if (!adminEmail || !adminPassword) {
    console.error('❌ Admin credentials required')
    console.error('\nUsage:')
    console.error('  node scripts/update-sso-redirect-uris.mjs <email> <password>')
    console.error('\nOr set in .env.local:')
    console.error('  SSO_ADMIN_EMAIL=your-email@example.com')
    console.error('  SSO_ADMIN_PASSWORD=your-password')
    process.exit(1)
  }
  
  // Generate all required redirect URIs
  const baseUri = new URL(redirectUri)
  const allRedirectUris = [
    redirectUri, // Current
    redirectUri.replace('/sso/callback', '/callback'), // Alias route
    redirectUri.replace('localhost:3000', 'localhost:6000'), // Alternative port
    redirectUri.replace('localhost:3000', 'localhost:6000').replace('/sso/callback', '/callback'),
    'https://cardmass.doneisbetter.com/api/auth/sso/callback',
    'https://cardmass.doneisbetter.com/api/auth/callback',
  ]
  
  const uniqueUris = [...new Set(allRedirectUris)]
  
  console.log(`\n📋 Configuration:`)
  console.log(`   Client ID: ${clientId}`)
  console.log(`   SSO Base URL: ${ssoBaseUrl}`)
  console.log(`   Admin Email: ${adminEmail}`)
  
  console.log(`\n📝 Redirect URIs to set:`)
  uniqueUris.forEach((uri, i) => {
    console.log(`   ${i + 1}. ${uri}`)
  })
  
  try {
    // Login to SSO
    console.log(`\n🔐 Logging into SSO...`)
    const sessionToken = await loginToSSO(ssoBaseUrl, adminEmail, adminPassword)
    console.log('✅ Logged in successfully')
    
    // Get current client
    console.log(`\n📥 Fetching current client configuration...`)
    const currentClient = await getClient(ssoBaseUrl, clientId, sessionToken)
    console.log(`✅ Client found: ${currentClient.name}`)
    console.log(`   Current redirect URIs: ${currentClient.redirect_uris.length}`)
    currentClient.redirect_uris.forEach(uri => console.log(`     - ${uri}`))
    
    // Check if update is needed
    const needsUpdate = !uniqueUris.every(uri => currentClient.redirect_uris.includes(uri))
    
    if (!needsUpdate) {
      console.log(`\n✅ All required redirect URIs are already configured!`)
      process.exit(0)
    }
    
    // Update client
    console.log(`\n🔄 Updating redirect URIs...`)
    const updatedClient = await updateClient(ssoBaseUrl, clientId, uniqueUris, sessionToken)
    console.log('✅ Client updated successfully!')
    console.log(`\n📋 New redirect URIs:`)
    updatedClient.redirect_uris.forEach(uri => console.log(`   ✓ ${uri}`))
    
    console.log(`\n✅ Fix complete! You can now test SSO login.`)
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      console.error('\n💡 Tip: You need super-admin role to update OAuth clients')
    }
    if (error.message.includes('Login failed')) {
      console.error('\n💡 Tip: Check your admin email and password')
    }
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

