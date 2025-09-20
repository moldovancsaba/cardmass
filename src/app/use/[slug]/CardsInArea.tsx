"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Card } from '@/lib/types'

async function fetchCards(boardSlug: string): Promise<Card[]> {
  const res = await fetch(`/api/cards?board=${encodeURIComponent(boardSlug)}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load cards')
  return res.json()
}

export default function CardsInArea({ boardSlug, areaLabel }: { boardSlug: string, areaLabel: string }) {
  const [cards, setCards] = useState<Card[]>([])
  const load = useCallback(async () => {
    try {
      const data = await fetchCards(boardSlug)
      setCards(data)
    } catch {}
  }, [boardSlug])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const h = () => load()
    try { window.addEventListener('card:created', h) } catch {}
    return () => { try { window.removeEventListener('card:created', h) } catch {} }
  }, [load])

  const areaKey = areaLabel.toLowerCase()
  const items = useMemo(() => cards.filter(c => (c.areaLabel || '').toLowerCase() === areaKey), [cards, areaKey])

  if (!items.length) return null

  return (
    <div className="space-y-2">
      {items.map((c) => (
        <div key={c.id} className="bg-white text-black border border-gray-300 rounded p-2 text-sm">
          <div className="whitespace-pre-wrap">{c.text}</div>
        </div>
      ))}
    </div>
  )
}
