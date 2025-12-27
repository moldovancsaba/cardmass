#!/usr/bin/env node
/**
 * SSO Environment Variable Validation and Auto-Commit Script
 * 
 * WHAT: Validates required SSO environment variables and optionally commits changes
 * WHY: Ensures SSO configuration is correct before deployment
 * 
 * Features:
 * - Validates SSO env vars from .env.local
 * - Checks format (UUIDs, URLs)
 * - Optionally commits and pushes changes
 * - Can be used in CI/CD pipelines
 * 
 * Usage:
 *   Validate only:              node scripts/validate-sso-env.mjs
 *   Validate + commit:         node scripts/validate-sso-env.mjs --commit
 *   Validate + commit + push:  node scripts/validate-sso-env.mjs --commit --push
 *   Check Vercel (via API):     node scripts/validate-sso-env.mjs --vercel-check [URL]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// ============================================================================
// Configuration
// ============================================================================

const REQUIRED_ENV_VARS = {
  SSO_BASE_URL: {
    required: true,
    pattern: /^https?:\/\/.+/,
    example: 'https://sso.doneisbetter.com',
    description: 'SSO service base URL'
  },
  SSO_CLIENT_ID: {
    required: true,
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    example: 'da8ad396-5bb2-41ea-8404-3c4203cd8c0d',
    description: 'OAuth2 client ID (UUID format)'
  },
  SSO_CLIENT_SECRET: {
    required: true,
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'OAuth2 client secret (UUID format)'
  },
  SSO_REDIRECT_URI: {
    required: true,
    pattern: /^https?:\/\/.+\/api\/auth\/(sso\/)?callback$/,
    example: 'http://localhost:3000/api/auth/callback',
    description: 'OAuth2 redirect URI (must end with /api/auth/callback or /api/auth/sso/callback)'
  }
}

// ============================================================================
// Environment Loading
// ============================================================================

/**
 * WHAT: Load environment variables from .env.local
 * WHY: Check local configuration before deployment
 */
function loadEnvFile() {
  const envPath = path.join(rootDir, '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found')
    console.error(`   Expected at: ${envPath}`)
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

/**
 * WHAT: Load environment variables from process.env (for Vercel/production)
 * WHY: Check runtime environment configuration
 */
function loadProcessEnv() {
  return {
    SSO_BASE_URL: process.env.SSO_BASE_URL,
    SSO_CLIENT_ID: process.env.SSO_CLIENT_ID,
    SSO_CLIENT_SECRET: process.env.SSO_CLIENT_SECRET,
    SSO_REDIRECT_URI: process.env.SSO_REDIRECT_URI,
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * WHAT: Validate a single environment variable
 * WHY: Ensure format and presence match requirements
 */
function validateEnvVar(key, value, config) {
  const errors = []
  const warnings = []

  if (!value || value.trim() === '') {
    if (config.required) {
      errors.push(`Missing required variable: ${key}`)
    }
    return { valid: !config.required, errors, warnings }
  }

  if (config.pattern && !config.pattern.test(value)) {
    errors.push(
      `Invalid format for ${key}: "${value}"\n` +
      `  Expected format: ${config.description}\n` +
      `  Example: ${config.example}`
    )
  }

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * WHAT: Validate all SSO environment variables
 * WHY: Comprehensive check before deployment
 */
function validateSSOEnv(env, source = 'local') {
  console.log(`\n🔍 Validating SSO environment variables (${source})...\n`)

  const results = {
    valid: true,
    missing: [],
    invalid: [],
    present: []
  }

  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = env[key]
    const validation = validateEnvVar(key, value, config)

    if (!value || value.trim() === '') {
      if (config.required) {
        results.missing.push({ key, config })
        results.valid = false
        console.error(`❌ ${key}: MISSING`)
        console.error(`   ${config.description}`)
        console.error(`   Example: ${config.example}\n`)
      } else {
        console.warn(`⚠️  ${key}: Not set (optional)\n`)
      }
    } else if (!validation.valid) {
      results.invalid.push({ key, value, config, errors: validation.errors })
      results.valid = false
      console.error(`❌ ${key}: INVALID`)
      validation.errors.forEach(err => console.error(`   ${err}`))
      console.error(`   Current value: ${value}`)
      console.error(`   Example: ${config.example}\n`)
    } else {
      results.present.push({ key, value: maskSecret(key, value) })
      console.log(`✅ ${key}: ${maskSecret(key, value)}`)
    }
  }

  return results
}

/**
 * WHAT: Mask sensitive values in output
 * WHY: Security - don't expose secrets in logs
 */
function maskSecret(key, value) {
  if (key.includes('SECRET') || key.includes('SECRET')) {
    if (!value || value.length < 8) return '***TOO_SHORT***'
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
  }
  return value
}

// ============================================================================
// Git Operations
// ============================================================================

/**
 * WHAT: Check if git is available and repo is clean
 * WHY: Ensure safe commit operations
 */
function checkGitStatus() {
  try {
    execSync('git --version', { stdio: 'ignore' })
  } catch {
    throw new Error('Git is not available. Install git to use --commit option.')
  }

  const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: rootDir })
  return status.trim() === ''
}

/**
 * WHAT: Commit changes with descriptive message
 * WHY: Track SSO configuration updates
 */
function commitChanges(message) {
  try {
    execSync('git add .env.local', { stdio: 'inherit', cwd: rootDir })
    execSync(`git commit -m "${message}"`, { stdio: 'inherit', cwd: rootDir })
    console.log('✅ Changes committed successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to commit changes:', error.message)
    return false
  }
}

/**
 * WHAT: Push changes to remote repository
 * WHY: Trigger automatic Vercel deployment
 */
function pushChanges() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
      encoding: 'utf8',
      cwd: rootDir 
    }).trim()
    
    console.log(`\n🚀 Pushing to ${branch}...`)
    execSync(`git push origin ${branch}`, { stdio: 'inherit', cwd: rootDir })
    console.log('✅ Changes pushed successfully')
    console.log('   Vercel will automatically deploy if GitHub integration is enabled')
    return true
  } catch (error) {
    console.error('❌ Failed to push changes:', error.message)
    return false
  }
}

// ============================================================================
// Vercel Check (via API)
// ============================================================================

/**
 * WHAT: Check SSO env vars on Vercel via debug endpoint
 * WHY: Verify production configuration without dashboard access
 */
async function checkVercelEnv(vercelUrl) {
  if (!vercelUrl) {
    console.error('❌ Vercel URL required for --vercel-check')
    console.error('   Usage: node scripts/validate-sso-env.mjs --vercel-check https://cardmass.doneisbetter.com')
    return
  }

  try {
    console.log(`\n🌐 Checking Vercel environment at ${vercelUrl}...\n`)
    const response = await fetch(`${vercelUrl}/api/auth/sso/debug`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const env = data.environment || {}
    
    console.log('Vercel Environment Variables:')
    console.log('─'.repeat(50))
    
    const results = validateSSOEnv(env, 'Vercel')
    
    if (results.valid) {
      console.log('\n✅ All SSO environment variables are correctly configured on Vercel')
    } else {
      console.log('\n❌ Some SSO environment variables are missing or invalid on Vercel')
      console.log('\nTo fix:')
      console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
      console.log('2. Add or update the missing variables')
      console.log('3. Redeploy your application')
    }
    
    return results
  } catch (error) {
    console.error('❌ Failed to check Vercel environment:', error.message)
    if (error.message.includes('fetch')) {
      console.error('   Make sure the Vercel URL is accessible and the debug endpoint is enabled')
    }
    return null
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const shouldCommit = args.includes('--commit')
  const shouldPush = args.includes('--push')
  const vercelCheck = args.includes('--vercel-check')
  const vercelUrlIndex = args.indexOf('--vercel-check') + 1
  const vercelUrl = args[vercelUrlIndex]?.startsWith('http') ? args[vercelUrlIndex] : null

  console.log('🔐 SSO Environment Variable Validation\n')
  console.log('='.repeat(60))

  // Check Vercel if requested
  if (vercelCheck) {
    await checkVercelEnv(vercelUrl)
    return
  }

  // Validate local environment
  const env = loadEnvFile()
  const results = validateSSOEnv(env, 'local')

  // Summary
  console.log('\n' + '='.repeat(60))
  if (results.valid) {
    console.log('✅ All SSO environment variables are valid!')
  } else {
    console.log('❌ Validation failed!')
    console.log(`   Missing: ${results.missing.length} variable(s)`)
    console.log(`   Invalid: ${results.invalid.length} variable(s)`)
    process.exit(1)
  }

  // Git operations
  if (shouldCommit) {
    if (checkGitStatus()) {
      console.log('\n⚠️  No changes to commit (working directory is clean)')
    } else {
      const message = 'chore: validate and update SSO environment variables'
      if (commitChanges(message)) {
        if (shouldPush) {
          pushChanges()
        } else {
          console.log('\n💡 Tip: Use --push to automatically push and trigger Vercel deployment')
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60))
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

