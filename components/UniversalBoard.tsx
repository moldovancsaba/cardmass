"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchJSON } from '@/lib/client'
import BottomBar from '@/components/BottomBar'
import { CardItem as BoardCardItem } from '@/components/Board'
import type { Card } from '@/types/card'
import type { LayoutAdapter } from '@/types/layout'

// UniversalBoard: centralized board component driven by a LayoutAdapter
// Unlimited pages, layouts, boxes, and labels can be expressed by supplying an adapter.
// Drag-and-drop semantics are the same everywhere.

export default function UniversalBoard({ adapter }: { adapter: LayoutAdapter }) {
  type G = string
  const [lists, setLists] = useState<Record<G, Card[]>>({})
  const [dragging, setDragging] = useState<{ id: string; from: G } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ group: G; index: number | null } | null>(null)

  const load = useCallback(async () => {
    const next: Record<G, Card[]> = {}
    await Promise.all(adapter.groups.map(async (g) => {
      const qs = `${adapter.queryKey}=${encodeURIComponent(g.id)}`
      // If a layout wants a default group (like backlog) from a broader query, its adapter can override groups or combine after load.
      next[g.id] = await fetchJSON<Card[]>(`/api/cards?${qs}`)
    }))
    setLists(next)
  }, [adapter])

  useEffect(() => { load() }, [load])

  const byOrder = useCallback((a: Card, b: Card) => {
    const field = adapter.orderField as keyof Card
    const av = (a as unknown as Record<string, unknown>)[field]
    const bv = (b as unknown as Record<string, unknown>)[field]
    const ao = Number.isFinite(av as number) ? (av as number) : Number.MAX_SAFE_INTEGER
    const bo = Number.isFinite(bv as number) ? (bv as number) : Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  }, [adapter.orderField])
  const insertSorted = useCallback((arr: Card[]) => { const next = [...arr]; next.sort(byOrder); return next }, [byOrder])

  const computeOrder = useCallback((list: Card[], dropIndex: number) => {
    const field = adapter.orderField as keyof Card
    const prev = list[dropIndex - 1] || null
    const next = list[dropIndex] || null
    const get = (c: Card | null, idx: number) => {
      const v = c ? (c as unknown as Record<string, unknown>)[field] : NaN
      return Number.isFinite(v) ? (v as number) : idx * 2
    }
    if (prev && next) {
      const p = get(prev, dropIndex - 1), n = get(next, dropIndex)
      if (p < n) return (p + n) / 2
      return p + 1
    }
    if (!prev && next) return get(next, dropIndex) - 1
    if (prev && !next) return get(prev, dropIndex - 1) + 1
    return 0
  }, [adapter.orderField])

  const updateCard = useCallback(async (id: string, data: Partial<Card>) => {
    const updated = await fetchJSON<Card>(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    // Remove card from any list and reinsert into proper list
    setLists((prev) => {
      const clone: Record<G, Card[]> = {}
      for (const k of Object.keys(prev)) clone[k] = prev[k].filter((c) => c.id !== id)
      const g = (adapter.getGroup(updated) ?? adapter.groups[0].id) as G
      clone[g] = insertSorted([...(clone[g] || []), updated])
      return clone
    })
  }, [adapter, insertSorted])

  const onContainerDragOver = useCallback((group: G) => {
    setDropTarget(prev => ({ group, index: prev?.group === group ? (prev.index ?? null) : null }))
  }, [])

  const handleDrop = useCallback(async (group: G) => {
    const drag = dragging
    const target = dropTarget
    setDragging(null)
    setDropTarget(null)
    if (!drag) return
    const id = drag.id
    const current = lists[group] || []
    let dropIndex = typeof target?.index === 'number' && target.group === group ? target.index : current.length
    const filtered = current.filter(c => c.id !== id)
    if (dropIndex > filtered.length) dropIndex = filtered.length
    const order = computeOrder(filtered, Math.max(0, Math.min(filtered.length, dropIndex)))
    await updateCard(id, adapter.patchBody(group, order))
  }, [dragging, dropTarget, lists, computeOrder, updateCard, adapter])

  const createCard = useCallback(async (text: string) => {
    const created = await fetchJSON<Card>(`/api/cards`, { method: 'POST', body: JSON.stringify({ text, ...adapter.createDefaults() }) })
    // Place into its default group
    const g = (adapter.getGroup(created) ?? adapter.groups[0].id) as G
    setLists((prev) => ({ ...prev, [g]: insertSorted([created, ...(prev[g] || [])]) }))
  }, [adapter, insertSorted])

  const stats = useMemo(() => ({ minAge: 0, maxAge: 0, minRot: 0, maxRot: 0 }), [])

  return (
    <div className="relative flex flex-col xl:h-full xl:min-h-0">
      <div className="flex-1 xl:overflow-hidden xl:min-h-0 grid gap-4" style={{ gridTemplateRows: `repeat(${adapter.grid.rows.length}, minmax(0, 1fr))` }}>
        {adapter.grid.rows.map((row, rIdx) => (
          <div key={rIdx} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
            {row.map((gid) => {
              const g = adapter.groups.find((x) => x.id === gid)!
              const cards = lists[gid] || []
              const { bg, fg, bgSoft } = adapter.colors(null, gid)
              return (
                <div
                  key={gid}
                  className={`border rounded-lg p-3 xl:h-full xl:min-h-0 flex flex-col text-black ${(dropTarget?.group === gid) ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-300'}`}
                  style={{ backgroundColor: bgSoft }}
                  onDragOver={(e) => { e.preventDefault(); try { ((e as unknown as DragEvent).dataTransfer as DataTransfer).dropEffect = 'move' } catch {}; onContainerDragOver(gid) }}
                  onDragEnter={() => onContainerDragOver(gid)}
                  onDrop={(e) => { e.preventDefault(); handleDrop(gid) }}
                >
                  <div className="mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>{g.title}</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-auto pr-1">
                    {cards.map((c, idx) => (
                      <BoardCardItem
                        key={c.id}
                        index={idx}
                        status={c.status}
                        card={c}
                        onUpdate={(id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => updateCard(id, data as Partial<Card>)}
                        onDelete={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'DELETE' }); setLists(prev => ({ ...prev, [gid]: (prev[gid] || []).filter(x => x.id !== id) })) }}
                        onArchive={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) }); setLists(prev => ({ ...prev, [gid]: (prev[gid] || []).filter(x => x.id !== id) })) }}
                        onHoverIndex={(t: { status: Card['status']; index: number | null }) => setDropTarget({ group: gid, index: t.index })}
                        bubbleContext={{ kind: c.status, ...stats }}
                        onDragFlag={(d) => setDragging(d ? { id: (d as unknown as { id: string }).id, from: gid } : null)}
                        extraChips={adapter.extraChips ? adapter.extraChips(c) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <BottomBar
        view={'kanban'}
        onCreate={createCard}
        showToggle={false}
        showArchive={true}
        showKanban={true}
        showMatrix={true}
        showBusiness={true}
        showProof={true}
      />
    </div>
  )
}
