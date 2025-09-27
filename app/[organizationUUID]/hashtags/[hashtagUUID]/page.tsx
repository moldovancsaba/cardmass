import { headers } from 'next/headers'
import { isUUIDv4 } from '@/lib/validation'

async function getBaseURL(): Promise<string> {
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'
}

async function fetchHashtag(orgUUID: string, tagUUID: string) {
  const base = await getBaseURL()
  const res = await fetch(`${base}/api/v1/organizations/${encodeURIComponent(orgUUID)}/hashtags/${encodeURIComponent(tagUUID)}`, { cache: 'no-store', headers: { 'X-Organization-UUID': orgUUID } })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || data?.error || 'Load failed')
  return data as { uuid: string; boardKey: string; label: string; count: number; cards: { uuid: string; text: string; createdAt: string; updatedAt: string; boardAreas?: Record<string,string> }[] }
}

// Fetch per-board area map (label -> {color, textBlack})
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

export default async function HashtagPage(ctx: { params: Promise<{ organizationUUID: string; hashtagUUID: string }> }) {
  const { organizationUUID: org, hashtagUUID } = await ctx.params
  if (!isUUIDv4(org)) {
    return (<main className="min-h-dvh p-6"><h1 className="text-xl font-semibold">Invalid URL</h1></main>)
  }
  const tag = await fetchHashtag(org, hashtagUUID)
  // Collect involved board ids from all cards
  const set = new Set<string>()
  for (const c of tag.cards) {
    const ba = (c.boardAreas || {}) as Record<string, string>
    for (const k of Object.keys(ba)) if (k) set.add(k)
  }
  const areaMaps = await fetchBoardsAreaMap(org, Array.from(set))

  return (
    <main className="min-h-dvh bg-white text-black">
      <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">#{tag.label}</h1>
          <div className="text-xs text-gray-600">{tag.count} card(s)</div>
        </header>
        <div className="space-y-4">
          {tag.cards.map((c) => (
            <article key={c.uuid} className="border border-gray-200 rounded p-3 bg-white shadow-sm">
              <div className="text-sm text-gray-500 mb-2">UUID: <code className="font-mono">{c.uuid}</code></div>
              <div className="text-base whitespace-pre-wrap">{c.text}</div>
              <div className="mt-2 text-xs text-gray-600">created: {c.createdAt}</div>
              <div className="mt-1 text-xs text-gray-600">updated: {c.updatedAt}</div>
              {/* Hashtags for this card (non-clickable), colored by per-board area styles */}
              {Object.entries(c.boardAreas || {}).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                  {Object.entries(c.boardAreas || {}).map(([bid, lblRaw]) => {
                    const name = String(lblRaw || '').toLowerCase()
                    if (!name || name === 'spock') return null
                    const cmap = (areaMaps as Record<string, Record<string, { color: string; textBlack: boolean }>>)[bid] || {}
                    const entry = cmap[name]
                    const bg = entry?.color || '#e5e7eb'
                    const tBlack = entry?.textBlack ?? true
                    return (
                      <span key={`card-tag-${c.uuid}-${bid}-${name}`} className="px-1 rounded" style={{ backgroundColor: bg, color: tBlack ? '#000' : '#fff' }}>#{name}</span>
                    )
                  })}
                </div>
              )}
            </article>
          ))}
          {tag.cards.length === 0 && (
            <div className="text-sm text-gray-600">No cards for this hashtag</div>
          )}
        </div>
      </section>
    </main>
  )
}
