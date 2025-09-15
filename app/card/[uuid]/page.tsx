import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import FooterNav from '@/components/FooterNav'

export const revalidate = 0
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PublicShare = { uuid: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }
type PublicCard = { id: string; uuid?: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }

function CardBox({ titleChips, text, meta }: { titleChips: string[]; text: string; meta: string[] }) {
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm max-w-2xl w-full">
      <div className="text-sm font-mono text-gray-700 mb-2 flex gap-2 flex-wrap">
        {titleChips.map((chip, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-200 text-gray-800">{chip}</span>
        ))}
      </div>
      <div className="text-base whitespace-pre-wrap text-black">{text}</div>
      <div className="mt-3 text-[10px] text-gray-600 space-x-3">
        {meta.map((m, i) => (<span key={i}>{m}</span>))}
      </div>
    </div>
  )
}

export default async function CardPublicPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const h = await headers()
  const host = (await h).get('x-forwarded-host') || (await h).get('host') || process.env.VERCEL_URL || ''
  const proto = (await h).get('x-forwarded-proto') || 'https'
  const base = `${proto}://${host}`

  // 1) Try share by UUID with absolute URL
  try {
    const res = await fetch(`${base}/api/public/shares/${encodeURIComponent(uuid)}`, { cache: 'no-store' })
    if (res.ok) {
      const share = (await res.json()) as PublicShare
      const chips = [ `#${share.status}` ]
      if (share.business) chips.push(`#${share.business}`)
      const meta = [ `UUID: ${share.uuid}`, `Created: ${share.createdAt}`, `Updated: ${share.updatedAt}` ]
      return (
        <main className="p-4 bg-white text-black min-h-screen flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <CardBox titleChips={chips} text={share.text} meta={meta} />
          </div>
          <div className="pt-2">
            {/* Centralized footer */}
            <FooterNav />
          </div>
        </main>
      )
    }
  } catch {}

  // 2) Legacy card uuid → create/reuse share → redirect; else by-id
  try {
    const cardRes = await fetch(`${base}/api/cards/by-uuid/${encodeURIComponent(uuid)}`, { cache: 'no-store' })
    if (cardRes.ok) {
      const card = (await cardRes.json()) as PublicCard
      const shareRes = await fetch(`${base}/api/public/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id })
      })
      if (shareRes.ok) {
        const { uuid: newUuid } = (await shareRes.json()) as { uuid?: string }
        if (newUuid) redirect(`/card/${newUuid}`)
      }
      redirect(`/card/id/${card.id}`)
    }
  } catch {}

  // 3) Last resort: scan list by absolute URL and redirect
  try {
    const listRes = await fetch(`${base}/api/cards?archived=false`, { cache: 'no-store' })
    if (listRes.ok) {
      const arr = (await listRes.json()) as PublicCard[]
      const match = Array.isArray(arr) ? arr.find(c => c.uuid === uuid) : null
      if (match) {
        const shareRes = await fetch(`${base}/api/public/shares`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: match.id })
        })
        if (shareRes.ok) {
          const { uuid: newUuid } = (await shareRes.json()) as { uuid?: string }
          if (newUuid) redirect(`/card/${newUuid}`)
        }
        redirect(`/card/id/${match.id}`)
      }
    }
  } catch {}

  return notFound()
}
