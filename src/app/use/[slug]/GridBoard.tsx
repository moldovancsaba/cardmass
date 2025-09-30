"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Card as ApiCard } from '@/lib/types'
import type { Card as UiCard } from '@/types/card'

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

  const onUpdate = useCallback(async (id: string, data: Partial<Pick<ApiCard, 'text' | 'status' | 'order'>>) => {
    const res = await fetch(`/api/cards/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) return
    try { bcRef.current?.postMessage({ type: 'card:updated' }) } catch {}
    try { window.dispatchEvent(new CustomEvent('card:updated')) } catch {}
    const updated: ApiCard = await res.json()
    // Update order within area (status ignored here)
    const area = (updated.areaLabel || '').toLowerCase()
    // Remove from all
    setCardsByArea((prev) => {
      const next: Record<string, ApiCard[]> = {}
      for (const [k, arr] of Object.entries(prev)) next[k] = arr.filter(c => c.id !== id)
      if (area) {
        const arr = (next[area] || []).concat(updated)
        arr.sort(byOrder)
        next[area] = arr
      }
      return next
    })
  }, [])

  const onDelete = useCallback(async (id: string) => {
    await fetch(`/api/cards/${id}`, { method: 'DELETE' })
    try { bcRef.current?.postMessage({ type: 'card:deleted' }) } catch {}
    try { window.dispatchEvent(new CustomEvent('card:deleted')) } catch {}
    setCardsByArea((prev) => {
      const next: Record<string, ApiCard[]> = {}
      for (const [k, arr] of Object.entries(prev)) next[k] = arr.filter(c => c.id !== id)
      return next
    })
  }, [])

  const onArchive = useCallback(async (id: string) => {
    await fetch(`/api/cards/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: true }) })
    try { bcRef.current?.postMessage({ type: 'card:archived' }) } catch {}
    try { window.dispatchEvent(new CustomEvent('card:archived')) } catch {}
    setCardsByArea((prev) => {
      const next: Record<string, ApiCard[]> = {}
      for (const [k, arr] of Object.entries(prev)) next[k] = arr.filter(c => c.id !== id)
      return next
    })
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

  // Stats for bubble gradients per area
  const stats = useMemo(() => {
    const out: Record<string, { minAge: number; maxAge: number; minRot: number; maxRot: number }> = {}
    for (const [area, arr] of Object.entries(cardsByArea)) {
      if (!arr.length) { out[area] = { minAge: 0, maxAge: 0, minRot: 0, maxRot: 0 }; continue }
      const ages = arr.map((c) => Date.now() - new Date(c.createdAt).getTime())
      const rots = arr.map((c) => Date.now() - new Date(c.updatedAt).getTime())
      out[area] = {
        minAge: Math.min(...ages),
        maxAge: Math.max(...ages),
        minRot: Math.min(...rots),
        maxRot: Math.max(...rots),
      }
    }
    return out
  }, [cardsByArea])

  return (
    <div className="grid gap-0 w-full h-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
      {boxes.map((b) => {
        const area = b.key
        const list = cardsByArea[area] || []
        const areaStats = stats[area] || { minAge: 0, maxAge: 0, minRot: 0, maxRot: 0 }
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
{list.map((c, idx) => {
                const ui: UiCard = { id: c.id, text: c.text, status: (c.status as UiCard['status']) || 'decide', order: c.order, createdAt: c.createdAt, updatedAt: c.updatedAt }
                const onUpdateUi: (id: string, data: Partial<Pick<UiCard, 'text'|'status'|'order'>>) => Promise<void> = async (id, data) => {
                  const payload: Partial<Pick<ApiCard, 'text'|'status'|'order'>> = {}
                  if (typeof data.text === 'string') payload.text = data.text
                  if (typeof data.order === 'number') payload.order = data.order
                  if (data.status) payload.status = data.status as ApiCard['status']
                  await onUpdate(id, payload)
                }
                const onDeleteUi: (id: string) => Promise<void> = async (id) => { await onDelete(id) }
                const onArchiveUi: (id: string) => Promise<void> = async (id) => { await onArchive(id) }

                // Build styled hashtags with colors from creator boards across the app
                const styledChips = (() => {
                  const out: { text: string; bg: string; fg: string }[] = []
                  const ba = c.boardAreas || {}
                  const seen = new Set<string>()
                  function textFg(bg: string) {
                    try {
                      const hex = bg.startsWith('#') ? bg.slice(1) : bg
                      const r = parseInt(hex.slice(0,2), 16), g = parseInt(hex.slice(2,4), 16), b = parseInt(hex.slice(4,6), 16)
                      // Perceived luminance
                      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
                      return L > 150 ? '#000' : '#fff'
                    } catch { return '#000' }
                  }
                  for (const [slugKey, lbl] of Object.entries(ba)) {
                    const lc = (lbl || '').toLowerCase()
                    if (!lc || lc.includes('spock')) continue
                    const color = labelColorCache[slugKey]?.[lc] || '#e5e7eb'
                    const key = `${lc}@${color}`
                    if (seen.has(key)) continue
                    seen.add(key)
                    out.push({ text: `#${lbl}`, bg: color, fg: textFg(color) })
                  }
                  return out
                })()

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
