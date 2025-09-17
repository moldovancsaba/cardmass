'use client'

// Archive is a client page; Board not used here
import { fetchJSON } from '@/lib/client'
import { useEffect, useMemo, useState } from 'react'
import { useSettings } from '@/lib/settings'
import { daysBetweenUtc } from '@/lib/date'
import { interpolateColor, withAlpha } from '@/lib/color'
import FooterNav from '@/components/FooterNav'

export default function ArchivePage() {
  return (
    <main className="p-4 bg-white text-black flex flex-col xl:h-screen xl:overflow-hidden">
      <div className="flex-1 xl:overflow-hidden">
        <ArchiveGrid />
      </div>
      <div className="pt-2 xl:pt-2">
        <FooterNav />
      </div>
    </main>
  )
}

type ACard = {
  id: string
  text: string
  status: 'delegate'|'decide'|'do'|'decline'
  order?: number
  archived?: boolean
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

function ArchiveGrid() {
  const [items, setItems] = useState<ACard[]>([])
  const settings = useSettings()
  const archOldest = settings?.colors?.archive?.oldest || '#6b7280'
  const archNewest = settings?.colors?.archive?.newest || '#d1d5db'

  useEffect(() => {
    let cancelled = false
    async function load() {
      const all = await fetchJSON<ACard[]>(`/api/cards?status=delegate&archived=true`)
      const b = await fetchJSON<ACard[]>(`/api/cards?status=decide&archived=true`)
      const t = await fetchJSON<ACard[]>(`/api/cards?status=do&archived=true`)
      const d = await fetchJSON<ACard[]>(`/api/cards?status=decline&archived=true`)
      const merged = [...all, ...b, ...t, ...d]
      merged.sort((a, b) => (new Date(b.archivedAt || 0).getTime()) - (new Date(a.archivedAt || 0).getTime()))
      if (!cancelled) setItems(merged)
    }
    load().catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="border border-gray-300 rounded-lg p-3 h-full md:min-h-0 flex flex-col text-black bg-white">
      <div className="mb-2">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: (settings?.colors?.labels?.archive || '#e5e7eb'), color: ((settings?.colors?.textContrast?.labels?.archive ?? true) ? '#000' : '#fff') }}>#archive</span>
      </div>
      <div className="flex-1 overflow-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c, idx) => (
            <ArchivedCard key={c.id} card={c} archOldest={archOldest} archNewest={archNewest} index={idx} total={items.length} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ArchivedCard({ card, archOldest, archNewest, index, total }: { card: ACard, archOldest: string, archNewest: string, index: number, total: number }) {
  const daysAgo = useMemo(() => daysBetweenUtc(card.archivedAt || card.updatedAt), [card.archivedAt, card.updatedAt])
  // Interpolate color based on relative position (newest -> oldest)
  const t = total > 1 ? index / (total - 1) : 1
  const bg = interpolateColor(archOldest, archNewest, t)
  const settings = useSettings()
  const archiveBlack = settings?.colors?.textContrast?.ranges?.archive ?? true
  return (
    <div className="border border-gray-300 rounded-md p-3 text-black" style={{ backgroundColor: withAlpha(bg, 0.3) }}>
      <div className="whitespace-pre-wrap text-sm mb-2">{card.text}</div>
      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: archiveBlack ? '#000' : '#fff' }}>
        #archived {daysAgo} days ago
      </span>
    </div>
  )
}
