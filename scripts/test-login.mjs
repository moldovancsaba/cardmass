#!/usr/bin/env node
/**
 * Test Admin Login Script
 * 
 * WHAT: Tests the admin login endpoint and auth check
 * WHY: Verify authentication system is working before integrating into UI
 * 
 * Usage:
 *   node scripts/test-login.mjs <email> <password>
 * 
 * Example:
 *   node scripts/test-login.mjs admin@doneisbetter.com 753f54954c5b09718890ef5f5d16fe4a
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testLogin(email, password) {
  console.log('🔐 Testing admin login...\n')
  console.log('📧 Email:', email)
  console.log('🌐 API:', `${BASE_URL}/api/auth/login\n`)

  try {
    // Test login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const loginData = await loginRes.json()

    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginData.error)
      process.exit(1)
    }

    console.log('✅ Login successful!')
    console.log('👤 User:', loginData.user)
    
    // Extract cookie from response
    const setCookieHeader = loginRes.headers.get('set-cookie')
    if (!setCookieHeader) {
      console.error('❌ No session cookie returned')
      process.exit(1)
    }

    console.log('🍪 Session cookie set:', setCookieHeader.split(';')[0])

    // Test auth check with cookie
    console.log('\n🔍 Testing auth check with session cookie...\n')

    const authCheckRes = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: {
        Cookie: setCookieHeader.split(';')[0], // Only send the cookie value
      },
    })

    const authCheckData = await authCheckRes.json()

    if (!authCheckRes.ok) {
      console.error('❌ Auth check failed')
      process.exit(1)
    }

    console.log('✅ Auth check successful!')
    console.log('🔓 Authenticated:', authCheckData.authenticated)
    console.log('👤 User:', authCheckData.user)

    // Test logout
    console.log('\n🚪 Testing logout...\n')

    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: setCookieHeader.split(';')[0],
      },
    })

    const logoutData = await logoutRes.json()

    if (!logoutRes.ok) {
      console.error('❌ Logout failed')
      process.exit(1)
    }

    console.log('✅ Logout successful!')
    console.log('📝 Message:', logoutData.message)

    console.log('\n🎉 All tests passed!\n')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Parse command line args
const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('Usage: node scripts/test-login.mjs <email> <password>')
  console.error('Example: node scripts/test-login.mjs admin@example.com 753f54954c5b09718890ef5f5d16fe4a')
  process.exit(1)
}

testLogin(email, password)
