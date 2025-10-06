'use client'

/**
 * WHAT: Helper page to clear stale cookies and browser cache
 * WHY: Browser caching can cause 404 issues even when the page exists on the server
 * HOW: Forces browser to clear cookies and reload without cache
 */

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ClearSessionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  useEffect(() => {
    async function clearSession() {
      // Step 1: Clear the admin session cookie
      setStep(1)
      await fetch('/api/auth/logout', { method: 'POST' })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 2: Clear all cookies for this domain
      setStep(2)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 3: Force cache clear by reloading
      setStep(3)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 4: Redirect to home with cache-busting parameter
      setStep(4)
      window.location.href = '/?cleared=' + Date.now()
    }

    clearSession()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Clearing Session & Cache
        </h1>
        
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${step >= 1 ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="text-gray-700">Logging out...</span>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-lg ${step >= 2 ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <span className="text-gray-700">Clearing cookies...</span>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-lg ${step >= 3 ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}`}>
              {step > 3 ? '✓' : '3'}
            </div>
            <span className="text-gray-700">Clearing browser cache...</span>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-lg ${step >= 4 ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}`}>
              {step > 4 ? '✓' : '4'}
            </div>
            <span className="text-gray-700">Redirecting to login...</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Why is this needed?</strong><br />
            Your browser may have cached an old version of the page. This tool clears all cookies and forces a fresh reload.
          </p>
        </div>
      </div>
    </div>
  )
}
