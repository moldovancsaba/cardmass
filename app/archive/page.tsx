'use client'

// Archive is a client page; Board not used here
import { fetchJSON } from '@/lib/client'
import { useEffect, useMemo, useState } from 'react'
import { useSettings } from '@/lib/settings'
import { hoursBetweenUtc } from '@/lib/date'

export default function ArchivePage() {
  return (
    <main className="min-h-screen p-4 bg-white text-black">
      <ArchiveGrid />
      <div className="sticky bottom-0 mt-4 bg-white border border-gray-300 rounded-md p-2 flex items-center gap-2 justify-end">
        <a href="/kanban" className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black">kanban</a>
        <a href="/matrix" className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black">matrix</a>
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
  const rotStart = settings?.colors?.rotten?.least || '#2ecc71'

  useEffect(() => {
    let cancelled = false
    async function load() {
      const all = await fetchJSON<ACard[]>(`/api/cards?status=roadmap&archived=true`)
      const b = await fetchJSON<ACard[]>(`/api/cards?status=backlog&archived=true`)
      const t = await fetchJSON<ACard[]>(`/api/cards?status=todo&archived=true`)
      const merged = [...all, ...b, ...t]
      merged.sort((a, b) => (new Date(b.archivedAt || 0).getTime()) - (new Date(a.archivedAt || 0).getTime()))
      if (!cancelled) setItems(merged)
    }
    load().catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="border border-gray-300 rounded-lg p-3 text-black bg-white">
      <div className="text-sm font-mono text-black mb-2">#archive</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c) => (
          <ArchivedCard key={c.id} card={c} rotStart={rotStart} />
        ))}
      </div>
    </div>
  )
}

function ArchivedCard({ card, rotStart }: { card: ACard, rotStart: string }) {
  const hoursAgo = useMemo(() => hoursBetweenUtc(card.archivedAt || card.updatedAt), [card.archivedAt, card.updatedAt])
  const daysAgo = Math.floor(hoursAgo / 24)
  // For simplicity, use rotten color scale to theme the archived badge
  return (
    <div className="border border-gray-300 rounded-md p-3 bg-white text-black">
      <div className="whitespace-pre-wrap text-sm mb-2">{card.text}</div>
      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: rotStart }}>
        #archived {daysAgo} days{hoursAgo > 0 ? ` (${hoursAgo} hours)` : ''} ago
      </span>
    </div>
  )
}
