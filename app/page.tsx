'use client'

import SpockNav from "@/components/SpockNav";
import OrgHome from '@/components/OrgHome'
import { Button } from '@/components/Button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function HomePageContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')
  const [userName, setUserName] = useState<string | null>(null)

  // WHAT: Check authentication status on mount
  // WHY: Only show organizations to authenticated users
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/check', { credentials: 'include' })
        const data = await res.json()
        if (data.authenticated) {
          setAuthState('authenticated')
          setUserName(data.user?.name || null)
        } else {
          setAuthState('unauthenticated')
        }
      } catch (err) {
        console.error('[Auth Check] Failed:', err)
        setAuthState('unauthenticated')
      }
    }
    checkAuth()
  }, [])

  // WHAT: Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    auth_failed: 'Authentication failed. Please try again.',
    token_exchange_failed: 'Token exchange failed. Check redirect URI configuration.',
    token_verification_failed: 'Token verification failed. Check SSO service status.',
    sso_not_configured: 'SSO not configured. Check environment variables.',
    permission_check_failed: 'Permission check failed. Check SSO service status.',
    user_not_found: 'User not found in SSO system.',
    oauth_denied: 'You denied access to the application.',
    invalid_callback: 'Invalid OAuth callback. Please try again.',
    invalid_state: 'Security validation failed. Please try again.',
    missing_verifier: 'Session expired. Please try again.',
    no_access: 'You do not have access to this application. Contact your administrator.',
  }

  // WHAT: Show loading state while checking authentication
  if (authState === 'checking') {
    return (
      <main className="min-h-dvh bg-white flex items-center justify-center">
        <div className="text-gray-600">Checking authentication...</div>
      </main>
    )
  }

  // WHAT: Show login page for unauthenticated users
  // WHY: Zero-trust - no content visible before authentication
  if (authState === 'unauthenticated') {
    return (
      <main className="min-h-dvh bg-white flex items-center justify-center">
        <section className="max-w-md w-full px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">cardmass</h1>
            <p className="text-gray-600">Manage organizations and boards</p>
          </div>

          {/* Error Message */}
          {error && errorMessages[error] && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {errorMessages[error]}
              </p>
            </div>
          )}

          {/* Login CTA */}
          <div className="text-center">
            <a
              href="/api/auth/sso/login?return_to=/"
              className="inline-flex items-center justify-center w-full px-5 py-3 text-base rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-700 hover:bg-green-800 focus:ring-green-600 shadow-sm"
              style={{ color: '#ffffff' }}
            >
              Sign in with SSO
            </a>
            <p className="mt-3 text-xs text-gray-500">Single Sign-On for all DoneIsBetter apps</p>
          </div>
        </section>
      </main>
    )
  }

  // WHAT: Show organizations UI for authenticated users
  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">cardmass</h1>
            {userName && <p className="text-sm text-gray-600 mt-1">Welcome, {userName}</p>}
          </div>
          <Button as="link" href="/api/auth/logout" variant="ghost" size="sm">
            Sign out
          </Button>
        </div>
        <OrgHome />
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    }>
      <HomePageContent />
    </Suspense>
  )
}
