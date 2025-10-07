/**
 * WHAT: Client component for hashtag details display with data fetching
 * WHY: Follows "server authenticates, client hydrates" pattern to prevent 404 bugs
 */

'use client'

import { useState, useEffect } from 'react'

// WHAT: Type definitions for hashtag and card data
// WHY: Ensures type safety across the component
type CardData = {
  uuid: string
  text: string
  createdAt: string
  updatedAt: string
  boardAreas?: Record<string, string>
}

type HashtagData = {
  uuid: string
  boardKey: string
  label: string
  count: number
  cards: CardData[]
}

type AreaStyle = {
  color: string
  textBlack: boolean
}

type BoardAreaMap = Record<string, Record<string, AreaStyle>>

interface HashtagDetailsClientProps {
  orgUUID: string
  hashtagUUID: string
}

export default function HashtagDetailsClient({ orgUUID, hashtagUUID }: HashtagDetailsClientProps) {
  const [hashtag, setHashtag] = useState<HashtagData | null>(null)
  const [areaMaps, setAreaMaps] = useState<BoardAreaMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHashtagData() {
      try {
        setLoading(true)
        setError(null)

        // WHAT: Fetch hashtag data from API
        // WHY: Hashtag details and associated cards needed for display
        const hashtagRes = await fetch(
          `/api/v1/organizations/${encodeURIComponent(orgUUID)}/hashtags/${encodeURIComponent(hashtagUUID)}`,
          {
            cache: 'no-store',
            headers: { 'X-Organization-UUID': orgUUID }
          }
        )

        if (!hashtagRes.ok) {
          const errorData = await hashtagRes.json()
          throw new Error(errorData?.error?.message || errorData?.error || 'Failed to load hashtag')
        }

        const hashtagData: HashtagData = await hashtagRes.json()
        setHashtag(hashtagData)

        // WHAT: Collect all board IDs from cards for area styling
        // WHY: Need to fetch board area colors for each board referenced in cards
        const boardIdSet = new Set<string>()
        for (const card of hashtagData.cards) {
          const boardAreas = card.boardAreas || {}
          for (const boardId of Object.keys(boardAreas)) {
            if (boardId) boardIdSet.add(boardId)
          }
        }

        const boardIds = Array.from(boardIdSet)

        if (boardIds.length > 0) {
          // WHAT: Fetch board area styling for colored hashtags
          // WHY: Display hashtags with colors matching tagger UI
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
        setError(err instanceof Error ? err.message : 'Failed to load hashtag details')
      } finally {
        setLoading(false)
      }
    }

    fetchHashtagData()
  }, [orgUUID, hashtagUUID])

  // WHAT: Loading state UI
  // WHY: Provides feedback while data is being fetched
  if (loading) {
    return (
      <main className="min-h-dvh bg-white text-black">
        <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          <div className="text-center text-gray-600">Loading hashtag details...</div>
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
  // WHY: Handle case where hashtag data is missing
  if (!hashtag) {
    return (
      <main className="min-h-dvh bg-white text-black">
        <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          <div className="text-center text-gray-600">Hashtag not found</div>
        </section>
      </main>
    )
  }

  // WHAT: Main hashtag display UI
  // WHY: Shows hashtag label, card count, and all associated cards with colored tags
  return (
    <main className="min-h-dvh bg-white text-black">
      <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">#{hashtag.label}</h1>
          <div className="text-xs text-gray-600">
            {hashtag.count} card{hashtag.count !== 1 ? 's' : ''}
          </div>
        </header>

        <div className="space-y-4">
          {hashtag.cards.map((card) => (
            <article
              key={card.uuid}
              className="border border-gray-200 rounded p-3 bg-white shadow-sm"
            >
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

              {/* WHAT: Hashtags for this card (non-clickable), colored by per-board area styles */}
              {/* WHY: Visual consistency with tagger UI */}
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
                        key={`card-tag-${card.uuid}-${bid}-${name}`}
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
          ))}

          {hashtag.cards.length === 0 && (
            <div className="text-sm text-gray-600 text-center py-6">
              No cards for this hashtag
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
