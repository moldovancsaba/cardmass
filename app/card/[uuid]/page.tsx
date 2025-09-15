import { notFound } from 'next/navigation'

export const revalidate = 0
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PublicShare = { uuid: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }

export default async function CardPublicPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const res = await fetch(`/api/public/shares/${encodeURIComponent(uuid)}`, { cache: 'no-store' })
  if (!res.ok) return notFound()
  const share = (await res.json()) as PublicShare
  return (
    <main className="p-4 bg-white text-black">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="text-xs font-mono text-gray-700">#{share.status} {share.business ? `#${share.business}` : ''}</div>
        <div className="text-lg whitespace-pre-wrap">{share.text}</div>
        <div className="text-xs text-gray-600">UUID: {share.uuid}</div>
        <div className="text-xs text-gray-600">Created: {share.createdAt}</div>
        <div className="text-xs text-gray-600">Updated: {share.updatedAt}</div>
      </div>
    </main>
  )
}
