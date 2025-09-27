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


export default async function CardDetailsPage(ctx: { params: Promise<{ organizationUUID: string; cardUUID: string }> }) {
  const { organizationUUID: org, cardUUID } = await ctx.params
  if (!isUUIDv4(org) || !isUUIDv4(cardUUID)) {
    return (
      <main className="min-h-dvh p-6"><h1 className="text-xl font-semibold">Invalid URL</h1></main>
    )
  }

  const card = await fetchCard(org, cardUUID)

  // WHAT: Build a unique, lowercase list of hashtags from all per-board area labels, excluding 'spock'.
  // WHY: Product requirement — display all related hashtags on the card view as a single comma-separated line; deduped across boards.
  const tags = Array.from(new Set(Object.values(card.boardAreas || {})
    .map(v => String(v || '').toLowerCase())
    .filter(name => name && name !== 'spock')
  ))

  return (
    <main className="min-h-dvh bg-white text-black">
      <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <article className="border border-gray-200 rounded p-3 bg-white shadow-sm">
          <div className="text-sm text-gray-500 mb-2">UUID: <code className="font-mono">{card.uuid}</code></div>
          <div className="text-base whitespace-pre-wrap">{card.text}</div>
          <div className="mt-2 text-xs text-gray-600">created: {card.createdAt}</div>
          <div className="mt-1 text-xs text-gray-600">updated: {card.updatedAt}</div>

          {/* Related hashtags (all unique labels across boards), rendered as a comma-separated textual list */}
          {tags.length > 0 && (
            <div className="mt-3 text-[10px]">{tags.map((t, i) => `#${t}${i < tags.length - 1 ? ', ' : ''}`)}</div>
          )}
        </article>
      </section>
    </main>
  )
}

