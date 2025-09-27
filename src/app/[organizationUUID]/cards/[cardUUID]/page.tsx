import { headers } from 'next/headers'
import { isUUIDv4 } from '@/lib/validation'

async function getBaseURL(): Promise<string> {
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'
}

async function fetchCard(orgUUID: string, cardUUID: string) {
  const base = await getBaseURL()
  const res = await fetch(`${base}/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(cardUUID)}`, { cache: 'no-store', headers: { 'X-Organization-UUID': orgUUID } })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || data?.error || 'Load failed')
  return data as { id: string; uuid: string; organizationId: string; text: string; status: string; order: number; createdAt: string; updatedAt: string; boardAreas?: Record<string,string> }
}

// WHAT: For colored hashtags, we need area color and text color (textBlack) from each involved board.
// WHY: This mirrors Tagger's UI where hashtags reflect per-board area styling.
async function fetchBoardsAreaMap(orgUUID: string, boardIds: string[]): Promise<Record<string, Record<string, { color: string; textBlack: boolean }>>> {
  const base = await getBaseURL()
  const entries = await Promise.all(boardIds.map(async (bid) => {
    try {
      const res = await fetch(`${base}/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards/${encodeURIComponent(bid)}`, { cache: 'no-store', headers: { 'X-Organization-UUID': orgUUID } })
      if (!res.ok) return [bid, {} as Record<string, { color: string; textBlack: boolean }>] as const
      const data = await res.json() as { areas?: { label: string; color: string; textBlack?: boolean }[] }
      const map: Record<string, { color: string; textBlack: boolean }> = {}
      for (const a of (data.areas || [])) {
        const lbl = (a.label || '').toLowerCase()
        if (!lbl) continue
        map[lbl] = { color: a.color, textBlack: a.textBlack !== false }
      }
      return [bid, map] as const
    } catch {
      return [bid, {} as Record<string, { color: string; textBlack: boolean }>] as const
    }
  }))
  const out: Record<string, Record<string, { color: string; textBlack: boolean }>> = {}
  for (const [bid, map] of entries) out[bid] = map
  return out
}


export default async function CardDetailsPage(ctx: { params: Promise<{ organizationUUID: string; cardUUID: string }> }) {
  const { organizationUUID: org, cardUUID } = await ctx.params
  if (!isUUIDv4(org) || !isUUIDv4(cardUUID)) {
    return (
      <main className="min-h-dvh p-6"><h1 className="text-xl font-semibold">Invalid URL</h1></main>
    )
  }

  const card = await fetchCard(org, cardUUID)

  // Build color map per board for colored hashtags
  const boardIds = Object.keys(card.boardAreas || {}).filter(Boolean)
  const areaMaps = await fetchBoardsAreaMap(org, boardIds)

  return (
    <main className="min-h-dvh bg-white text-black">
      <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <article className="border border-gray-200 rounded p-3 bg-white shadow-sm">
          <div className="text-sm text-gray-500 mb-2">UUID: <code className="font-mono">{card.uuid}</code></div>
          <div className="text-base whitespace-pre-wrap">{card.text}</div>
          <div className="mt-2 text-xs text-gray-600">created: {card.createdAt}</div>
          <div className="mt-1 text-xs text-gray-600">updated: {card.updatedAt}</div>

          {/* Colored hashtags based on per-board area styles */}
          {Object.entries(card.boardAreas || {}).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
              {Object.entries(card.boardAreas || {}).map(([bid, lblRaw]) => {
                const name = String(lblRaw || '').toLowerCase()
                if (!name || name === 'spock') return null
                const cmap = (areaMaps as Record<string, Record<string, { color: string; textBlack: boolean }>>)[bid] || {}
                const entry = cmap[name]
                const bg = entry?.color || '#e5e7eb'
                const tBlack = entry?.textBlack ?? true
                return (
                  <span key={`card-tag-${bid}-${name}`} className="px-1 rounded" style={{ backgroundColor: bg, color: tBlack ? '#000' : '#fff' }}>#{name}</span>
                )
              })}
            </div>
          )}
        </article>
      </section>
    </main>
  )
}

