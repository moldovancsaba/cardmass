'use client'

import SpockNav from "@/components/SpockNav";
import Link from 'next/link'
import OrgHome from '@/components/OrgHome'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function HomePageContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')

  // WHAT: Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    auth_failed: 'Authentication failed. Please try again.',
    oauth_denied: 'You denied access to the application.',
    invalid_callback: 'Invalid OAuth callback. Please try again.',
    invalid_state: 'Security validation failed. Please try again.',
    missing_verifier: 'Session expired. Please try again.',
    no_access: 'You do not have access to this application. Contact your administrator.',
  }

  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">cardmass</h1>
        <p className="mb-6">Manage organizations and boards (UUID routes, org-scoped).</p>

        {/* Error Message */}
        {error && errorMessages[error] && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {errorMessages[error]}
            </p>
          </div>
        )}

        {/* Primary SSO login CTA */}
        <div className="mb-8">
          <Link
            href="/api/auth/sso/login?return_to=/organizations"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-white font-medium shadow-sm hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Sign in with SSO
          </Link>
          <p className="mt-2 text-xs text-gray-500">Single Sign-On for all DoneIsBetter apps</p>
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
