/**
 * /admin/login
 * 
 * WHAT: Admin login page for zero-trust authentication.
 * WHY: Provides UI for admins to authenticate and bypass page passwords.
 */

'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/admin/dashboard';

  // WHAT: Check if already authenticated and redirect
  useEffect(() => {
    // Legacy admin session check (maintain backward compatibility)
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push(redirect);
        }
      })
      .catch(() => {});
  }, [router, redirect]);


  function handleSSOLogin() {
    // WHAT: Redirect to SSO OAuth login with return URL
    // WHY: Preserve intended destination after authentication
    const returnTo = searchParams?.get('redirect') || '/organizations';
    window.location.href = `/api/auth/sso/login?return_to=${encodeURIComponent(returnTo)}`;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              CardMass
            </h1>
            <p className="text-gray-600">
              Sign in to access your organizations
            </p>
          </div>

          {/* SSO Login (Only) */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleSSOLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm"
            >
              Sign in with SSO
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Single Sign-On for all DoneIsBetter apps
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              CardMass v1.14.0 — SSO-first Authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
