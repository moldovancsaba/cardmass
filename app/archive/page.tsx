'use client'

// Archive is a client page; Board not used here
import { fetchJSON } from '@/lib/client'
import { useEffect, useMemo, useState } from 'react'
import { useSettings } from '@/lib/settings'
import { daysBetweenUtc } from '@/lib/date'
import BottomBar from '@/components/BottomBar'
import { interpolateColor } from '@/lib/color'
import { useRouter } from 'next/navigation'

export default function ArchivePage() {
  const router = useRouter()
  return (
    <main className="p-4 bg-white text-black flex flex-col xl:h-screen xl:overflow-hidden">
      <div className="flex-1 xl:overflow-hidden">
        <ArchiveGrid />
      </div>
      <div className="pt-2 xl:pt-2">
        <BottomBar
          disabled
          view="kanban"
          showToggle={false}
          showArchive={false}
          showKanban={true}
          showMatrix={true}
          showAdmin={true}
          onKanbanNav={() => router.push('/kanban')}
          onMatrixNav={() => router.push('/matrix')}
          onAdminNav={() => router.push('/admin')}
        />
      </div>
    </main>
  )
}

type ACard = {
  id: string
  text: string
  status: 'roadmap'|'backlog'|'todo'
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
      const merged = [...all, ...b, ...t]
      merged.sort((a, b) => (new Date(b.archivedAt || 0).getTime()) - (new Date(a.archivedAt || 0).getTime()))
      if (!cancelled) setItems(merged)
    }
    load().catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="border border-gray-300 rounded-lg p-3 h-full md:min-h-0 flex flex-col text-black bg-white">
      <div className="text-sm font-mono text-black mb-2">#archive</div>
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
  return (
    <div className="border border-gray-300 rounded-md p-3 bg-white text-black">
      <div className="whitespace-pre-wrap text-sm mb-2">{card.text}</div>
      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg }}>
        #archived {daysAgo} days ago
      </span>
    </div>
  )
}
