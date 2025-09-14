import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

export default async function CardPublicPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const h = await headers()
  const host = (await h).get('x-forwarded-host') || (await h).get('host') || ''
  const proto = (await h).get('x-forwarded-proto') || 'https'
  const base = `${proto}://${host}`
  const res = await fetch(`${base}/api/cards?archived=false`, { cache: 'no-store' })
  if (!res.ok) return notFound()
  const arr = (await res.json()) as Array<{ uuid?: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }>
  const card = Array.isArray(arr) ? arr.find((c) => c?.uuid === uuid) : null
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
