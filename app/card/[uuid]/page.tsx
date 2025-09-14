import { connectToDatabase } from '@/lib/mongoose'
import { Card } from '@/models/Card'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function CardPublicPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  // First, try DB lookup
  await connectToDatabase()
  const doc = await Card.findOne({ uuid, archived: { $ne: true } })
  let card: { uuid?: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string } | null = null
  if (doc) {
    card = doc.toJSON() as { uuid?: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }
  } else {
    // Fallback to internal API (ensures we benefit from server-side uuid backfill)
    const res = await fetch(`/api/cards?archived=false`, { cache: 'no-store' })
    if (res.ok) {
      const arr = (await res.json()) as Array<{ uuid?: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }>
      card = Array.isArray(arr) ? arr.find((c) => c?.uuid === uuid) ?? null : null
    }
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
