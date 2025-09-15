export const revalidate = 0
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'

type PublicCard = { id: string; uuid?: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }

export default async function CardByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const res = await fetch(`/api/cards/${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (!res.ok) return notFound()
    const card = (await res.json()) as PublicCard
    return (
    <main className="p-4 bg-white text-black">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="text-xs font-mono text-gray-700">#{card.status} {card.business ? `#${card.business}` : ''}</div>
        <div className="text-lg whitespace-pre-wrap">{card.text}</div>
        <div className="text-xs text-gray-600">ID: {card.id}</div>
        {card.uuid ? <div className="text-xs text-gray-600">UUID: {card.uuid}</div> : null}
        <div className="text-xs text-gray-600">Created: {card.createdAt}</div>
        <div className="text-xs text-gray-600">Updated: {card.updatedAt}</div>
      </div>
    </main>
  )
  } catch {
    return notFound()
  }
}
