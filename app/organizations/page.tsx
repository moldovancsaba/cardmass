/**
 * WHAT: Organization selector page
 * WHY: Authenticated users choose which organization to work in
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface OrgAccess {
  organizationUUID: string
  role: 'super-admin' | 'org-admin' | 'member'
  name?: string
  slug?: string
  description?: string
}

interface UserInfo {
  name: string
  email: string
  role: string
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrgAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        // WHAT: Authentication disabled - fetch all organizations directly
        const orgsRes = await fetch('/api/v1/organizations')
        if (!orgsRes.ok) throw new Error('Failed to load organizations')
        
        // WHAT: API returns array directly, not wrapped in object
        const orgsArray = await orgsRes.json()
        // WHAT: Map to OrgAccess format expected by UI
        setOrganizations((Array.isArray(orgsArray) ? orgsArray : []).map(org => ({
          organizationUUID: org.uuid,
          role: 'member' as const, // Default role since auth is disabled
          name: org.name,
          slug: org.slug,
          description: org.description,
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Logout removed - authentication disabled

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading organizations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/"
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Select Organization</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              You don&apos;t have access to any organizations yet.
            </p>
            <p className="text-sm text-gray-500">
              Contact your administrator to request access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Link
                key={org.organizationUUID}
                href={`/${org.organizationUUID}`}
                className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-sky-400 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">🏢</div>
                  {org.role === 'org-admin' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  )}
                  {org.role === 'super-admin' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                      Super Admin
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {org.name || 'Unnamed Organization'}
                </h3>
                
                {org.slug && (
                  <p className="text-sm text-gray-500 mb-2">
                    @{org.slug}
                  </p>
                )}
                
                {org.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {org.description}
                  </p>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-sky-600 font-medium">
                    Enter Organization →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
