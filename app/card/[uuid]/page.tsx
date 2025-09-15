import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import FooterNav from '@/components/FooterNav'
import { interpolateColor } from '@/lib/color'
import { daysBetweenUtc } from '@/lib/date'

export const revalidate = 0
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PublicShare = { uuid: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }
type PublicCard = { id: string; uuid?: string; text: string; status: string; business?: string; createdAt: string; updatedAt: string }

function CardBox({ titleChips, chipBgColors, text, timingChips, meta }: { titleChips: string[]; chipBgColors?: (string | undefined)[]; text: string; timingChips?: { text: string; color: string }[]; meta: string[] }) {
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm max-w-2xl w-full">
      <div className="text-sm font-mono text-gray-700 mb-2 flex gap-2 flex-wrap">
        {titleChips.map((chip, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-mono text-gray-800" style={{ backgroundColor: chipBgColors?.[i] ?? '#e5e7eb' }}>{chip}</span>
        ))}
      </div>
      <div className="text-base whitespace-pre-wrap text-black">{text}</div>
      {Array.isArray(timingChips) && timingChips.length > 0 && (
        <div className="mt-3 text-[10px] font-mono flex gap-2 flex-wrap">
          {timingChips.map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-gray-800" style={{ backgroundColor: c.color }}>{c.text}</span>
          ))}
        </div>
      )}
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
      // Fetch settings and non-archived cards to compute global min/max for color semantics
      type Settings = { colors?: { age?: { oldest?: string; newest?: string }, rotten?: { least?: string; most?: string }, status?: { delegate?: string; decide?: string; do?: string; decline?: string }, businessBadges?: Record<string, string> } }
      const [settingsRes, listRes] = await Promise.all([
        fetch(`${base}/api/settings`, { cache: 'no-store' }),
        fetch(`${base}/api/cards?archived=false`, { cache: 'no-store' }),
      ])
      const settings = (settingsRes.ok ? await settingsRes.json() : {}) as Settings
      const cards = (listRes.ok ? await listRes.json() : []) as PublicCard[]

      const ages = cards.map(c => Date.now() - new Date(c.createdAt).getTime())
      const rots = cards.map(c => Date.now() - new Date(c.updatedAt).getTime())
      const minAge = ages.length ? Math.min(...ages) : 0
      const maxAge = ages.length ? Math.max(...ages) : 0
      const minRot = rots.length ? Math.min(...rots) : 0
      const maxRot = rots.length ? Math.max(...rots) : 0

      const ageMs = Date.now() - new Date(share.createdAt).getTime()
      const rotMs = Date.now() - new Date(share.updatedAt).getTime()
      const ageT = (maxAge - minAge) > 0 ? (ageMs - minAge) / (maxAge - minAge) : 1
      const rotT = (maxRot - minRot) > 0 ? (rotMs - minRot) / (maxRot - minRot) : 0

      const ageStart = settings?.colors?.age?.oldest || '#0a3d91'
      const ageEnd = settings?.colors?.age?.newest || '#9ecbff'
      const rotStart = settings?.colors?.rotten?.least || '#2ecc71'
      const rotEnd = settings?.colors?.rotten?.most || '#8e5b3a'

      const ageColor = interpolateColor(ageStart, ageEnd, ageT)
      const rotColor = interpolateColor(rotStart, rotEnd, rotT)
      const daysOld = daysBetweenUtc(share.createdAt)
      const rottenDays = daysBetweenUtc(share.updatedAt)

      // Title chips and their background colors (status + business)
      const titleChips: string[] = [ `#${share.status}` ]
      if (share.business) titleChips.push(`#${share.business}`)
      const chipBgColors: (string | undefined)[] = titleChips.map((chip) => {
        const raw = chip.replace('#','')
        const lower = raw.toLowerCase()
        const statusMap: Record<string, string> = (settings?.colors?.status ?? {}) as Record<string, string>
        const statusColor = statusMap[lower]
        if (statusColor) return statusColor
        const snake = raw.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/\s+/g,'_').toLowerCase()
        const mapped = snake === 'cost' ? 'cost_structure' : (snake === 'revenue_stream' ? 'revenue_streams' : snake)
        const bizMap: Record<string, string> = (settings?.colors?.businessBadges ?? {}) as Record<string, string>
        return bizMap[mapped]
      })

      const timingChips = [
        { text: `#Created ${daysOld} days ago`, color: ageColor },
        { text: `#rotten for ${rottenDays} days`, color: rotColor },
      ]

      const meta = [ `UUID: ${share.uuid}`, `Created: ${share.createdAt}`, `Updated: ${share.updatedAt}` ]
      return (
        <main className="p-4 bg-white text-black min-h-screen flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <CardBox titleChips={titleChips} chipBgColors={chipBgColors} text={share.text} timingChips={timingChips} meta={meta} />
          </div>
          <div className="pt-2">
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
