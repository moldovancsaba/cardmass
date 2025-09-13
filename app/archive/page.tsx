'use client'

// Archive is a client page; Board not used here
import { fetchJSON } from '@/lib/client'
import { useEffect, useMemo, useState } from 'react'
import { useSettings } from '@/lib/settings'
import { hoursBetweenUtc } from '@/lib/date'

export default function ArchivePage() {
  return (
    <main className="min-h-screen p-4 bg-white text-black">
      <h1 className="text-xl font-mono mb-4">#archive</h1>
      <ArchiveGrid />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((c) => (
        <ArchivedCard key={c.id} card={c} rotStart={rotStart} />
      ))}
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
        #archived {daysAgo} days ({hoursAgo} hours) ago
      </span>
    </div>
  )
}
