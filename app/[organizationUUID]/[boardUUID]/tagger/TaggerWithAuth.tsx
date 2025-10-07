/**
 * WHAT: Wrapper component that integrates PasswordGate with TaggerApp
 * WHY: Follows "server authenticates, client hydrates" pattern
 * PATTERN: Client component fetches board data after password gate passes
 */

'use client'

import { useState, useEffect } from 'react'
import PasswordGate from '@/components/PasswordGate'
import TaggerApp, { type Area } from './TaggerApp'

interface TaggerWithAuthProps {
  orgUUID: string
  boardUUID: string
}

type BoardDetails = {
  uuid: string
  rows: number
  cols: number
  areas: Area[]
  background?: string
}

export default function TaggerWithAuth({ orgUUID, boardUUID }: TaggerWithAuthProps) {
  const [boardData, setBoardData] = useState<BoardDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBoardData() {
      try {
        setLoading(true)
        setError(null)

        // WHAT: Fetch board details from API
        // WHY: Need rows, cols, areas, and background for TaggerApp
        const res = await fetch(
          `/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards/${encodeURIComponent(boardUUID)}`,
          {
            cache: 'no-store',
            headers: { 'X-Organization-UUID': orgUUID }
          }
        )

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData?.error?.message || errorData?.error || 'Failed to load board')
        }

        const data: BoardDetails = await res.json()
        setBoardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load board details')
      } finally {
        setLoading(false)
      }
    }

    fetchBoardData()
  }, [orgUUID, boardUUID])

  // WHAT: Loading state UI
  // WHY: Provides feedback while board data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Loading board...</div>
          <div className="text-sm text-gray-500">Fetching board configuration</div>
        </div>
      </div>
    )
  }

  // WHAT: Error state UI
  // WHY: Informs user of failures and provides retry mechanism
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-800 mb-4">
            <strong>Error loading board:</strong> {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // WHAT: Empty state UI
  // WHY: Handle case where board data is missing
  if (!boardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">Board not found</div>
      </div>
    )
  }

  // WHAT: Password gate wrapper with TaggerApp
  // WHY: Requires password validation before allowing board access
  return (
    <PasswordGate pageId={boardUUID} pageType="tagger" organizationUUID={orgUUID}>
      {({ getAuthHeaders }) => (
        <TaggerApp
          orgUUID={orgUUID}
          boardUUID={boardUUID}
          rows={Number(boardData.rows) || 0}
          cols={Number(boardData.cols) || 0}
          areas={Array.isArray(boardData.areas) ? boardData.areas : []}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </PasswordGate>
  )
}
