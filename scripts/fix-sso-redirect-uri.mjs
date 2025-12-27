#!/usr/bin/env node
/**
 * SSO Redirect URI Fix Guide
 * 
 * WHAT: Provides instructions and API calls to fix redirect URI mismatch
 * WHY: Redirect URI must EXACTLY match between cardmass .env.local and SSO client settings
 * 
 * Usage: node scripts/fix-sso-redirect-uri.mjs
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

async function main() {
  console.log('🔧 SSO Redirect URI Fix Guide\n')
  console.log('='.repeat(60))
  
  const env = loadEnv()
  const clientId = env.SSO_CLIENT_ID
  const redirectUri = env.SSO_REDIRECT_URI
  const ssoBaseUrl = env.SSO_BASE_URL || 'https://sso.doneisbetter.com'
  
  if (!clientId || !redirectUri) {
    console.error('❌ SSO_CLIENT_ID or SSO_REDIRECT_URI not found in .env.local')
    process.exit(1)
  }
  
  console.log('\n📋 Current Configuration:')
  console.log('─'.repeat(60))
  console.log(`Client ID: ${clientId}`)
  console.log(`Redirect URI: ${redirectUri}`)
  console.log(`SSO Base URL: ${ssoBaseUrl}`)
  
  // Generate all possible redirect URIs
  const baseUri = new URL(redirectUri)
  const allRedirectUris = [
    redirectUri, // Current
    redirectUri.replace('/sso/callback', '/callback'), // Alias route
    redirectUri.replace('localhost:3000', 'localhost:6000'), // Alternative port
    redirectUri.replace('localhost:3000', 'localhost:6000').replace('/sso/callback', '/callback'),
    'https://cardmass.doneisbetter.com/api/auth/sso/callback',
    'https://cardmass.doneisbetter.com/api/auth/callback',
  ]
  
  // Remove duplicates
  const uniqueUris = [...new Set(allRedirectUris)]
  
  console.log('\n📝 Required Redirect URIs in SSO:')
  console.log('─'.repeat(60))
  uniqueUris.forEach((uri, i) => {
    console.log(`${i + 1}. ${uri}`)
  })
  
  console.log('\n🔧 Fix Instructions:')
  console.log('='.repeat(60))
  console.log('\nOption 1: Via SSO Admin UI (Recommended)')
  console.log('─'.repeat(60))
  console.log(`1. Go to: ${ssoBaseUrl}/admin/oauth-clients`)
  console.log(`2. Find CardMass client (ID: ${clientId})`)
  console.log(`3. Click "Edit"`)
  console.log(`4. In "Redirect URIs" field, ensure ALL these URIs are listed:`)
  uniqueUris.forEach(uri => console.log(`   - ${uri}`))
  console.log(`5. Click "Save"`)
  
  console.log('\nOption 2: Via SSO Script (If you have MongoDB access)')
  console.log('─'.repeat(60))
  console.log(`1. Go to SSO project: cd /Users/moldovancsaba/Projects/sso`)
  console.log(`2. Update scripts/fix-cardmass-redirects.mjs with these URIs:`)
  console.log(`   const NEW_REDIRECT_URIS = [`)
  uniqueUris.forEach(uri => console.log(`     '${uri}',`))
  console.log(`   ]`)
  console.log(`3. Run: node scripts/fix-cardmass-redirects.mjs`)
  
  console.log('\nOption 3: Via MongoDB Direct (Advanced)')
  console.log('─'.repeat(60))
  console.log(`1. Connect to MongoDB`)
  console.log(`2. Find the client:`)
  console.log(`   db.oauthClients.findOne({ client_id: '${clientId}' })`)
  console.log(`3. Update redirect_uris:`)
  console.log(`   db.oauthClients.updateOne(`)
  console.log(`     { client_id: '${clientId}' },`)
  console.log(`     { $set: { redirect_uris: ${JSON.stringify(uniqueUris, null, 2)} } }`)
  console.log(`   )`)
  
  console.log('\n✅ After Fix:')
  console.log('─'.repeat(60))
  console.log('1. Test SSO login again')
  console.log('2. Check server logs for detailed error messages')
  console.log('3. Run: npm run sso:validate')
  
  console.log('\n' + '='.repeat(60))
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})

