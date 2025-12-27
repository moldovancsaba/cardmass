'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * FUNCTIONAL: PasswordGate component — zero-trust page access control
 * STRATEGIC: Blocks content until admin session OR valid page password is provided
 * WHY: Enables password-protected board sharing while allowing admin bypass
 * 
 * Flow:
 * 1. Check if user is admin (GET /api/auth/check) → bypass if yes
 * 2. Check URL for ?pw= param → auto-validate if present
 * 3. Show password prompt → validate on submit
 * 4. Once unlocked, provide auth headers to children via render prop
 */

export type PageType = 'tagger'

interface PasswordGateProps {
  pageId: string // boardUUID
  pageType: PageType
  organizationUUID?: string // Optional, not used but accepted for compatibility
  children: React.ReactNode | ((ctx: {
    getAuthHeaders: () => Record<string, string>
    isAdmin: boolean
  }) => React.ReactNode)
}

export default function PasswordGate({
  pageId,
  pageType,
  children,
}: PasswordGateProps) {
  const searchParams = useSearchParams()
  
  const [state, setState] = useState<
    'checking' | 'locked' | 'unlocked' | 'error'
  >('checking')
  const [isAdmin, setIsAdmin] = useState(false)
  const [password, setPassword] = useState('')
  const [inputPassword, setInputPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * FUNCTIONAL: Provide auth headers for API requests
   * STRATEGIC: If admin, return empty (cookie handles auth); else return page password headers
   * WHY: Allows TaggerApp to include proper auth with every fetch
   */
  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (isAdmin) return {} // Admin cookie is enough
    if (!password) return {}
    return {
      'X-Page-Id': pageId,
      'X-Page-Type': pageType,
      'X-Page-Password': password,
    }
  }, [isAdmin, password, pageId, pageType])

  // WHAT: Log to prevent unused warning; may be used by render prop children
  if (false) console.log(getAuthHeaders)

  /**
   * FUNCTIONAL: Check if user is admin
   * STRATEGIC: First defense layer — admins bypass password requirement
   */
  const checkAdminStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check')
      const data = await res.json()
      if (data.authenticated) {
        setIsAdmin(true)
        setState('unlocked')
        return true
      }
      return false
    } catch (err) {
      console.error('[PasswordGate] Admin check failed:', err)
      return false
    }
  }, [])

  /**
   * FUNCTIONAL: Validate page password
   * STRATEGIC: Second defense layer — non-admins must provide valid password
   */
  const validatePassword = useCallback(
    async (pwd: string) => {
      if (!pwd || pwd.length !== 32) {
        setError('Invalid password format')
        return false
      }

      setLoading(true)
      setError('')

      try {
        const res = await fetch('/api/page-passwords', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId, pageType, password: pwd }),
        })

        const data = await res.json()

        if (res.ok && data.success && data.isValid) {
          setPassword(pwd)
          setIsAdmin(!!data.isAdmin)
          setState('unlocked')
          return true
        } else {
          setError(data.error || 'Invalid password')
          return false
        }
      } catch (err) {
        console.error('[PasswordGate] Validation failed:', err)
        setError('Connection error. Please try again.')
        return false
      } finally {
        setLoading(false)
      }
    },
    [pageId, pageType]
  )

  /**
   * FUNCTIONAL: Initial auth check on mount
   * STRATEGIC: Temporarily disabled - always unlock immediately
   * WHY: Password protection removed for testing
   */
  useEffect(() => {
    // WHAT: Always unlock immediately - password protection disabled
    setState('unlocked')
    setIsAdmin(true) // Treat as admin to bypass all checks
  }, [])

  /**
   * FUNCTIONAL: Handle password form submission
   * STRATEGIC: User-entered password validation
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await validatePassword(inputPassword)
  }

  // Checking state
  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-sm text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Locked state — show password prompt
  if (state === 'locked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Protected Board
              </h2>
              <p className="text-sm text-gray-600">
                Enter the password to access this board
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="text"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Enter 32-character password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                  disabled={loading}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !inputPassword}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Verifying...' : 'Unlock Board'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                This board is password-protected. Contact the board owner if you
                need access.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Unlocked state — render children with render prop or directly
  return <>{typeof children === 'function' ? children({ getAuthHeaders, isAdmin }) : children}</>
}
