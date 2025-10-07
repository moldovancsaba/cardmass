/**
 * WHAT: Organization header component with name display
 * WHY: Follows "server authenticates, client hydrates" pattern
 * PATTERN: Client component fetches org name for display
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface OrgHeaderProps {
  orgUUID: string
  userRole: string
}

export default function OrgHeader({ orgUUID, userRole }: OrgHeaderProps) {
  const [orgName, setOrgName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrgName() {
      try {
        const res = await fetch(
          `/api/v1/organizations/${encodeURIComponent(orgUUID)}`,
          {
            cache: 'no-store',
            headers: { 'X-Organization-UUID': orgUUID }
          }
        )
        
        if (res.ok) {
          const data = await res.json()
          setOrgName(data.name || null)
        }
      } catch {
        // WHAT: Silently fail - org name is cosmetic
        // WHY: Page should work even if name fetch fails
      } finally {
        setLoading(false)
      }
    }

    fetchOrgName()
  }, [orgUUID])

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Organization</h1>
        
        {/* WHAT: Colored org name pill with gradient based on name hash */}
        {/* WHY: Visual identity for organization, matches narimato style */}
        {loading && (
          <span className="px-2 py-0.5 text-sm rounded-full bg-gray-200 text-gray-500 animate-pulse">
            Loading...
          </span>
        )}
        
        {!loading && orgName && (
          <span
            className="px-2 py-0.5 text-sm rounded-full shadow-sm"
            style={(() => {
              // WHAT: Derive stable gradient from organization name
              // WHY: Each org gets consistent, unique color scheme
              let hash = 0
              for (let i = 0; i < orgName.length; i++) {
                hash = ((hash << 5) - hash + orgName.charCodeAt(i)) | 0
              }
              const h1 = Math.abs(hash) % 360
              const h2 = (h1 + 40) % 360
              const c1 = `hsl(${h1} 85% 85%)`
              const c2 = `hsl(${h2} 85% 75%)`
              return {
                background: `linear-gradient(135deg, ${c1}, ${c2})`,
                color: '#111'
              }
            })()}
            title={orgName}
          >
            {orgName}
          </span>
        )}
      </div>

      {/* WHAT: Primary action buttons for organization */}
      {/* WHY: Quick access to Creator, Settings, and organization list */}
      <div className="flex items-center gap-2">
        <Link
          className="px-4 py-1.5 text-sm rounded-full bg-sky-600 !text-white hover:bg-sky-700 hover:!text-white transition-colors font-medium"
          href={`/${encodeURIComponent(orgUUID)}/creator`}
        >
          Creator
        </Link>
        
        {/* WHAT: Settings button only for org-admins and super-admins */}
        {/* WHY: Regular members don't have admin permissions */}
        {(userRole === 'org-admin' || userRole === 'super-admin') && (
          <Link
            className="px-4 py-1.5 text-sm rounded-full bg-purple-600 !text-white hover:bg-purple-700 hover:!text-white transition-colors font-medium"
            href={`/${encodeURIComponent(orgUUID)}/settings`}
          >
            ⚙️ Organization Settings
          </Link>
        )}
        
        <Link
          className="px-4 py-1.5 text-sm rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          href="/organizations"
        >
          ← Back to Orgs
        </Link>
      </div>
    </header>
  )
}
