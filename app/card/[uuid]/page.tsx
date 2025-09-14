import { connectToDatabase } from '@/lib/mongoose'
import { Card } from '@/models/Card'
import { notFound } from 'next/navigation'

export default async function CardPublicPage({ params }: { params: Promise<{ uuid: string }> }) {
  await connectToDatabase()
  const { uuid } = await params
  const doc = await Card.findOne({ uuid, archived: { $ne: true } })
  if (!doc) return notFound()
  const card = doc.toJSON()
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
