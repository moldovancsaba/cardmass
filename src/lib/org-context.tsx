/**
 * WHAT: Organization context provider for admin panel
 * WHY: Provides consistent orgUUID throughout admin UI, synced with URL params and localStorage
 * 
 * Strategy: URL query parameter is primary source (?org=uuid), with localStorage fallback.
 * Aligns with middleware guard requirement that X-Organization-UUID must match path segment.
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { isUUIDv4 } from './validation'

interface OrgContextValue {
  orgUUID: string | null
  setOrgUUID: (uuid: string | null) => void
  isLoading: boolean
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined)

const STORAGE_KEY = 'cardmass.lastOrg'

export function OrgContextProvider({ children }: { children: ReactNode }) {
  const [orgUUID, setOrgUUIDState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // WHAT: Read orgUUID from URL query parameter
    const urlOrg = searchParams?.get('org')
    
    if (urlOrg && isUUIDv4(urlOrg)) {
      // Valid org in URL - use it and persist to localStorage
      setOrgUUIDState(urlOrg)
      localStorage.setItem(STORAGE_KEY, urlOrg)
      setIsLoading(false)
    } else {
      // No valid org in URL - try localStorage fallback
      const storedOrg = localStorage.getItem(STORAGE_KEY)
      if (storedOrg && isUUIDv4(storedOrg)) {
        setOrgUUIDState(storedOrg)
        // Update URL to reflect the org
        router.replace(`/organization/admin?org=${storedOrg}`)
      }
      setIsLoading(false)
    }
  }, [searchParams, router])

  const setOrgUUID = (uuid: string | null) => {
    setOrgUUIDState(uuid)
    if (uuid) {
      localStorage.setItem(STORAGE_KEY, uuid)
      router.replace(`/organization/admin?org=${uuid}`)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <OrgContext.Provider value={{ orgUUID, setOrgUUID, isLoading }}>
      {children}
    </OrgContext.Provider>
  )
}

/**
 * WHAT: Hook to access current organization UUID
 * WHY: Simplifies org-scoped API calls throughout admin UI
 */
export function useOrg() {
  const context = useContext(OrgContext)
  if (context === undefined) {
    throw new Error('useOrg must be used within OrgContextProvider')
  }
  return context
}
