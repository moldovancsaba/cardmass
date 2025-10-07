/**
 * WHAT: Client component for card details display with data fetching
 * WHY: Follows "server authenticates, client hydrates" pattern to prevent 404 bugs
 */

'use client'

import { useState, useEffect } from 'react'

// WHAT: Type definitions for card and board area data
// WHY: Ensures type safety across the component
type CardData = {
  id: string
  uuid: string
  organizationId: string
  text: string
  status: string
  order: number
  createdAt: string
  updatedAt: string
  boardAreas?: Record<string, string>
}

type AreaStyle = {
  color: string
  textBlack: boolean
}

type BoardAreaMap = Record<string, Record<string, AreaStyle>>

interface CardDetailsClientProps {
  orgUUID: string
  cardUUID: string
}

export default function CardDetailsClient({ orgUUID, cardUUID }: CardDetailsClientProps) {
  const [card, setCard] = useState<CardData | null>(null)
  const [areaMaps, setAreaMaps] = useState<BoardAreaMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCardData() {
      try {
        setLoading(true)
        setError(null)

        // WHAT: Fetch card data from API
        // WHY: Card details needed for display
        const cardRes = await fetch(
          `/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(cardUUID)}`,
          {
            cache: 'no-store',
            headers: { 'X-Organization-UUID': orgUUID }
          }
        )

        if (!cardRes.ok) {
          const errorData = await cardRes.json()
          throw new Error(errorData?.error?.message || errorData?.error || 'Failed to load card')
        }

        const cardData: CardData = await cardRes.json()
        setCard(cardData)

        // WHAT: Fetch board area styling for colored hashtags
        // WHY: Need to display hashtags with correct colors matching the tagger UI
        const boardIds = Object.keys(cardData.boardAreas || {}).filter(Boolean)
        
        if (boardIds.length > 0) {
          const areaMapResults = await Promise.all(
            boardIds.map(async (bid) => {
              try {
                const boardRes = await fetch(
                  `/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards/${encodeURIComponent(bid)}`,
                  {
                    cache: 'no-store',
                    headers: { 'X-Organization-UUID': orgUUID }
                  }
                )

                if (!boardRes.ok) return [bid, {}] as const

                const boardData = await boardRes.json() as { areas?: { label: string; color: string; textBlack?: boolean }[] }
                const map: Record<string, AreaStyle> = {}

                for (const area of (boardData.areas || [])) {
                  const label = (area.label || '').toLowerCase()
                  if (!label) continue
                  map[label] = {
                    color: area.color,
                    textBlack: area.textBlack !== false
                  }
                }

                return [bid, map] as const
              } catch {
                return [bid, {}] as const
              }
            })
          )

          const areasMap: BoardAreaMap = {}
          for (const [bid, map] of areaMapResults) {
            areasMap[bid] = map
          }
          setAreaMaps(areasMap)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load card details')
      } finally {
        setLoading(false)
      }
    }

    fetchCardData()
  }, [orgUUID, cardUUID])

  // WHAT: Loading state UI
  // WHY: Provides feedback while data is being fetched
  if (loading) {
    return (
      <main className="min-h-dvh bg-white text-black">
        <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          <div className="border border-gray-200 rounded p-3 bg-white shadow-sm">
            <div className="text-center text-gray-600">Loading card details...</div>
          </div>
        </section>
      </main>
    )
  }

  // WHAT: Error state UI
  // WHY: Informs user of failures and provides retry mechanism
  if (error) {
    return (
      <main className="min-h-dvh bg-white text-black">
        <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          <div className="border border-red-200 rounded p-3 bg-red-50 shadow-sm">
            <div className="text-red-800 mb-3">
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        </section>
      </main>
    )
  }

  // WHAT: Empty state UI
  // WHY: Handle case where card data is missing
  if (!card) {
    return (
      <main className="min-h-dvh bg-white text-black">
        <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          <div className="text-center text-gray-600">Card not found</div>
        </section>
      </main>
    )
  }

  // WHAT: Main card display UI
  // WHY: Shows card content with colored hashtags matching tagger styling
  return (
    <main className="min-h-dvh bg-white text-black">
      <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <article className="border border-gray-200 rounded p-3 bg-white shadow-sm">
          <div className="text-sm text-gray-500 mb-2">
            UUID: <code className="font-mono">{card.uuid}</code>
          </div>
          
          <div className="text-base whitespace-pre-wrap">{card.text}</div>
          
          <div className="mt-2 text-xs text-gray-600">
            created: {card.createdAt}
          </div>
          <div className="mt-1 text-xs text-gray-600">
            updated: {card.updatedAt}
          </div>

          {/* WHAT: Colored hashtags based on per-board area styles */}
          {/* WHY: Visual consistency with tagger UI, helps users identify board-specific tags */}
          {Object.entries(card.boardAreas || {}).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
              {Object.entries(card.boardAreas || {}).map(([bid, lblRaw]) => {
                const name = String(lblRaw || '').toLowerCase()
                if (!name || name === 'spock') return null
                
                const boardMap = areaMaps[bid] || {}
                const areaStyle = boardMap[name]
                const bgColor = areaStyle?.color || '#e5e7eb'
                const textBlack = areaStyle?.textBlack ?? true

                return (
                  <span
                    key={`card-tag-${bid}-${name}`}
                    className="px-1 rounded"
                    style={{
                      backgroundColor: bgColor,
                      color: textBlack ? '#000' : '#fff'
                    }}
                  >
                    #{name}
                  </span>
                )
              })}
            </div>
          )}
        </article>
      </section>
    </main>
  )
}
