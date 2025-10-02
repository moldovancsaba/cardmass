"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Card as ApiCard } from '@/lib/types'

export type Box = { key: string; label: string; color: string; minR: number; minC: number; maxR: number; maxC: number }

type Props = { boardSlug: string; rows: number; cols: number; boxes: Box[] }

type DragState = { id: string; from: string } | null

type DropTarget = { area: string; index: number | null } | null

// Broadcast message types for cross-window sync (no 'any' casts)
type CardEventType = 'card:created' | 'card:updated' | 'card:deleted' | 'card:archived'
type CardEventMessage = { type: CardEventType }
function isCardEventMessage(d: unknown): d is CardEventMessage {
  if (!d || typeof d !== 'object') return false
  const obj = d as Record<string, unknown>
  if (typeof obj.type !== 'string') return false
  return (
    obj.type === 'card:created' ||
    obj.type === 'card:updated' ||
    obj.type === 'card:deleted' ||
    obj.type === 'card:archived'
  )
}

function byOrder(a: ApiCard, b: ApiCard) {
  const ao = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER
  const bo = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER
  if (ao !== bo) return ao - bo
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export default function GridBoard({ boardSlug, rows, cols, boxes }: Props) {
  const [cardsByArea, setCardsByArea] = useState<Record<string, ApiCard[]>>({})
  const [dragging, setDragging] = useState<DragState>(null)
  const [target, setTarget] = useState<DropTarget>(null)
  const bcRef = useRef<BroadcastChannel | null>(null)
  // Cache of label colors per board slug: label(lowercased) -> color
  const [labelColorCache, setLabelColorCache] = useState<Record<string, Record<string, string>>>({})

  // Load all cards across boards and place them per current board rules.
  const load = useCallback(async () => {
    const res = await fetch(`/api/cards`, { cache: 'no-store' })
    if (!res.ok) return
    const data: ApiCard[] = await res.json()

    // Ensure we have colors for all boards referenced in boardAreas
    const neededSlugs = new Set<string>()
    for (const c of data) {
      const ba = c.boardAreas || {}
      for (const s of Object.keys(ba)) neededSlugs.add(s)
    }
    const missing = Array.from(neededSlugs).filter((s) => !labelColorCache[s])
    if (missing.length) {
      try {
        await Promise.all(missing.map(async (s) => {
          const r = await fetch(`/api/boards/${encodeURIComponent(s)}`, { cache: 'no-store' })
          if (!r.ok) return
          const b = await r.json() as { areas?: { label: string; color: string }[] }
          const map: Record<string, string> = {}
          for (const a of (b.areas || [])) {
            const lc = (a.label || '').toLowerCase()
            if (!lc) continue
            map[lc] = a.color
          }
          setLabelColorCache((prev) => ({ ...prev, [s]: map }))
        }))
      } catch {}
    }

    // Build per-board context for this board
    const areaSet = new Set<string>()
    for (const b of boxes) {
      const lc = (b.label || '').toLowerCase()
      areaSet.add(lc)
    }
    // Detect spock by exact match or labels that contain "spock" (case-insensitive)
    let spockKey: string | null = null
    if (areaSet.has('spock')) {
      spockKey = 'spock'
    } else {
      for (const lc of areaSet) { if (lc.includes('spock')) { spockKey = lc; break } }
    }

    // Group cards for display in this board
    const groups: Record<string, ApiCard[]> = {}
    for (const c of data) {
      const ba = (c.boardAreas || {}) as Record<string, string>
      const assigned = (ba[boardSlug] || '').toLowerCase()
      if (assigned && areaSet.has(assigned)) {
        const key = assigned
        if (!groups[key]) groups[key] = []
        groups[key].push(c)
      } else if (spockKey) {
        const key = spockKey
        if (!groups[key]) groups[key] = []
        groups[key].push(c)
      } else {
        // Hidden on this board: no placement and no spock fallback
      }
    }

    for (const k of Object.keys(groups)) groups[k].sort(byOrder)
    setCardsByArea(groups)
  }, [boardSlug, boxes, labelColorCache])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const h = () => load()
    try {
      window.addEventListener('card:created', h)
      window.addEventListener('card:updated', h)
      window.addEventListener('card:deleted', h)
      window.addEventListener('card:archived', h)
    } catch {}
    return () => {
      try {
        window.removeEventListener('card:created', h)
        window.removeEventListener('card:updated', h)
        window.removeEventListener('card:deleted', h)
        window.removeEventListener('card:archived', h)
      } catch {}
    }
  }, [load])
  // Cross-window real-time sync via BroadcastChannel
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('cardmass')
      bcRef.current = bc
      const onMsg = (ev: MessageEvent) => {
        try {
          if (isCardEventMessage(ev.data)) load()
        } catch {}
      }
      bc.addEventListener('message', onMsg)
      return () => { try { bc.removeEventListener('message', onMsg); bc.close(); bcRef.current = null } catch {} }
    } catch {}
  }, [load])

  const computeOrder = useCallback((list: ApiCard[], dropIndex: number) => {
    const prev = list[dropIndex - 1] || null
    const next = list[dropIndex] || null
    if (prev && next && prev.order < next.order) return (prev.order + next.order) / 2
    if (!prev && next) return next.order - 1
    if (prev && !next) return prev.order + 1
    return 0
  }, [])


  const onContainerDragOver = useCallback((area: string) => {
    setTarget((prev) => ({ area, index: prev?.area === area ? (prev.index ?? null) : null }))
  }, [])

const onDrop = useCallback(async (targetArea: string) => {
    const drag = dragging
    const t = target
    setTarget(null)
    setDragging(null)
    if (!drag) return

    const id = drag.id
    const current = (cardsByArea[targetArea] || [])
    let dropIndex = typeof t?.index === 'number' && t.area === targetArea ? t.index : current.length
    const filtered = current.filter((c) => c.id !== id)
    if (dropIndex > filtered.length) dropIndex = filtered.length
    const newOrder = computeOrder(filtered, Math.max(0, Math.min(filtered.length, dropIndex)))

    // Determine per-board placement semantics
    const isSpock = (() => { const lc = (targetArea || '').toLowerCase(); return lc === 'spock' || lc.includes('spock') })()
    const payload = isSpock
      ? { boardArea: { boardSlug, areaLabel: '' }, order: newOrder } // clear mapping (spock fallback)
      : { boardArea: { boardSlug, areaLabel: targetArea }, order: newOrder }

    // Update server: set/clear board-specific placement and order
    await fetch(`/api/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    try { bcRef.current?.postMessage({ type: 'card:updated' }) } catch {}
    try { window.dispatchEvent(new CustomEvent('card:updated')) } catch {}

    // Update client: move within cardsByArea for display purposes
    setCardsByArea((prev) => {
      const nx: Record<string, ApiCard[]> = {}
      for (const [k, arr] of Object.entries(prev)) nx[k] = arr.filter(c => c.id !== id)
      const moved = Object.values(prev).flat().find(c => c.id === id)
      if (moved) {
        // Simulate updated boardAreas for hashtag rendering (not used in grouping map directly)
        const ba = { ...(moved.boardAreas || {}) }
        if (isSpock) {
          delete ba[boardSlug]
        } else {
          ba[boardSlug] = targetArea
        }
        const updated = { ...moved, order: newOrder, boardAreas: ba }
        const list = (nx[targetArea] || []).concat(updated)
        list.sort(byOrder)
        nx[targetArea] = list
      }
      return nx
    })
  }, [dragging, target, cardsByArea, computeOrder, boardSlug])


  return (
    <div className="grid gap-0 w-full h-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
      {boxes.map((b) => {
        const area = b.key
        const list = cardsByArea[area] || []
        return (
          <div
            key={area}
            className={`relative border rounded-sm overflow-auto ${target?.area === area ? 'ring-2 ring-indigo-300' : ''}`}
            style={{
              backgroundColor: 'transparent',
              borderColor: '#e5e7eb',
              gridColumn: `${b.minC + 1} / ${b.maxC + 2}`,
              gridRow: `${b.minR + 1} / ${b.maxR + 2}`,
            }}
            onDragOver={(e) => { e.preventDefault(); try { const dt = (e as unknown as DragEvent).dataTransfer; if (dt) dt.dropEffect = 'move' } catch {}; onContainerDragOver(area) }}
            onDragEnter={() => onContainerDragOver(area)}
            onDrop={(e) => { e.preventDefault(); onDrop(area) }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(${parseInt(b.color.slice(1,3),16)}, ${parseInt(b.color.slice(3,5),16)}, ${parseInt(b.color.slice(5,7),16)}, 0.25)` }} />
            <span className="absolute top-1 left-1 text-[10px] font-mono px-1 rounded-sm pointer-events-none" style={{ backgroundColor: b.color, color: '#000' }}>#{b.label}</span>

            <div className="relative p-2 pt-8 space-y-2">
{list.map((c) => {
                return (
                  <div key={c.id} className="relative border border-gray-300 rounded px-2 py-1 text-xs bg-white text-black shadow-sm">
                    <div className="whitespace-pre-wrap break-words">{c.text}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
