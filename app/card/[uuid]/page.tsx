import { notFound } from 'next/navigation'

export const revalidate = 0
export const runtime = 'nodejs'

type PublicCard = { uuid?: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }

export default async function CardPublicPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  let card: PublicCard | null = null

  // Try by-uuid API first (fast path)
  try {
    const byUuid = await fetch(`/api/cards/by-uuid/${encodeURIComponent(uuid)}`, { cache: 'no-store' })
    if (byUuid.ok) {
      card = (await byUuid.json()) as PublicCard
    }
  } catch {}

  // Fallback: scan non-archived list (also triggers server-side uuid backfill)
  if (!card) {
    try {
      const res = await fetch(`/api/cards?archived=false`, { cache: 'no-store' })
      if (res.ok) {
        const arr = (await res.json()) as PublicCard[]
        card = Array.isArray(arr) ? arr.find((c) => c?.uuid === uuid) ?? null : null
      }
    } catch {}
  }

  if (!card) return notFound()
  return (
    <main className="p-4 bg-white text-black">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="text-xs font-mono text-gray-700">#{card.status} {card.business ? `#${card.business}` : ''}</div>
        <div className="text-lg whitespace-pre-wrap">{card.text}</div>
        <div className="text-xs text-gray-600">UUID: {card.uuid}</div>
        <div className="text-xs text-gray-600">Created: {card.createdAt}</div>
        <div className="text-xs text-gray-600">Updated: {card.updatedAt}</div>
      </div>
    </main>
  )
}
