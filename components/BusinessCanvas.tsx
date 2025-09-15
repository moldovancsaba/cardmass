"use client"

import { useCallback, useEffect, useState } from 'react'
import BottomBar from '@/components/BottomBar'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/lib/settings'
import { fetchJSON } from '@/lib/client'
import type { Card } from '@/types/card'
import { Column as BoardColumn, CardItem as BoardCardItem } from '@/components/Board'

// BusinessCanvas implements the Business Model Canvas layout (9 regions)
// Defaults come from settings.business; new cards always start in Value Propositions
// (bmc:value_propositions) and can be dragged to any other block.
export default function BusinessCanvas() {
  const router = useRouter()
  const s = useSettings()
  const titles = {
    kp: s.business?.key_partners || 'Key Partners',
    ka: s.business?.key_activities || 'Key Activities',
    kr: s.business?.key_resources || 'Key Resources',
    vp: s.business?.value_propositions || 'Value Propositions',
    cr: s.business?.customer_relationships || 'Customer Relationships',
    ch: s.business?.channels || 'Channels',
    cs: s.business?.customer_segments || 'Customer Segments',
    cost: s.business?.cost_structure || 'Cost Structure',
    rev: s.business?.revenue_streams || 'Revenue Streams',
  }

  type S = Card['status']
  const [kp, setKp] = useState<Card[]>([])
  const [ka, setKa] = useState<Card[]>([])
  const [kr, setKr] = useState<Card[]>([])
  const [vp, setVp] = useState<Card[]>([])
  const [cr, setCr] = useState<Card[]>([])
  const [ch, setCh] = useState<Card[]>([])
  const [cs, setCs] = useState<Card[]>([])
  const [cost, setCost] = useState<Card[]>([])
  const [rev, setRev] = useState<Card[]>([])

  const [dragging, setDragging] = useState<{ id: string; from: S } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ status: S; index: number | null } | null>(null)

  const load = useCallback(async () => {
    const [a,b,c,d,e,f,g,h,i] = await Promise.all([
      fetchJSON<Card[]>(`/api/cards?status=bmc:key_partners`),
      fetchJSON<Card[]>(`/api/cards?status=bmc:key_activities`),
      fetchJSON<Card[]>(`/api/cards?status=bmc:key_resources`),
      fetchJSON<Card[]>(`/api/cards?status=bmc:value_propositions`),
      fetchJSON<Card[]>(`/api/cards?status=bmc:customer_relationships`),
      fetchJSON<Card[]>(`/api/cards?status=bmc:channels`),
      fetchJSON<Card[]>(`/api/cards?status=bmc:customer_segments`),
      fetchJSON<Card[]>(`/api/cards?status=bmc:cost_structure`),
      fetchJSON<Card[]>(`/api/cards?status=bmc:revenue_streams`),
    ])
    setKp(a); setKa(b); setKr(c); setVp(d); setCr(e); setCh(f); setCs(g); setCost(h); setRev(i)
  }, [])

  useEffect(() => { load() }, [load])

  // Sorting and order calculation helpers (same approach as Board)
  const byOrder = useCallback((a: Card, b: Card) => {
    const ao = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER
    const bo = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  }, [])

  const insertSorted = useCallback((arr: Card[]) => {
    const next = [...arr]
    next.sort(byOrder)
    return next
  }, [byOrder])

  const computeOrder = useCallback((list: Card[], dropIndex: number) => {
    const prev = list[dropIndex - 1] || null
    const next = list[dropIndex] || null
    if (prev && next && prev.order < next.order) return (prev.order + next.order) / 2
    if (!prev && next) return next.order - 1
    if (prev && !next) return prev.order + 1
    return 0
  }, [])

  const createCard = useCallback(async (text: string) => {
    // Always create in Value Propositions
    const created = await fetchJSON<Card>(`/api/cards`, {
      method: 'POST',
      body: JSON.stringify({ text, status: 'bmc:value_propositions' }),
    })
    setVp((prev) => insertSorted([created, ...prev]))
  }, [insertSorted])

  const updateCard = useCallback(async (id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => {
    const updated = await fetchJSON<Card>(`/api/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    // remove everywhere
    setKp(p => p.filter(c => c.id !== id))
    setKa(p => p.filter(c => c.id !== id))
    setKr(p => p.filter(c => c.id !== id))
    setVp(p => p.filter(c => c.id !== id))
    setCr(p => p.filter(c => c.id !== id))
    setCh(p => p.filter(c => c.id !== id))
    setCs(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setRev(p => p.filter(c => c.id !== id))
    // insert back
    // insertion handled inline below to keep eslint satisfied
    if (updated.status === 'bmc:key_partners') setKp(a => insertSorted([...a, updated]))
    if (updated.status === 'bmc:key_activities') setKa(a => insertSorted([...a, updated]))
    if (updated.status === 'bmc:key_resources') setKr(a => insertSorted([...a, updated]))
    if (updated.status === 'bmc:value_propositions') setVp(a => insertSorted([...a, updated]))
    if (updated.status === 'bmc:customer_relationships') setCr(a => insertSorted([...a, updated]))
    if (updated.status === 'bmc:channels') setCh(a => insertSorted([...a, updated]))
    if (updated.status === 'bmc:customer_segments') setCs(a => insertSorted([...a, updated]))
    if (updated.status === 'bmc:cost_structure') setCost(a => insertSorted([...a, updated]))
    if (updated.status === 'bmc:revenue_streams') setRev(a => insertSorted([...a, updated]))
  }, [insertSorted])

  const archiveCard = useCallback(async (id: string) => {
    await fetchJSON(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) })
    setKp(p => p.filter(c => c.id !== id))
    setKa(p => p.filter(c => c.id !== id))
    setKr(p => p.filter(c => c.id !== id))
    setVp(p => p.filter(c => c.id !== id))
    setCr(p => p.filter(c => c.id !== id))
    setCh(p => p.filter(c => c.id !== id))
    setCs(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setRev(p => p.filter(c => c.id !== id))
  }, [])

  const deleteCard = useCallback(async (id: string) => {
    await fetchJSON(`/api/cards/${id}`, { method: 'DELETE' })
    setKp(p => p.filter(c => c.id !== id))
    setKa(p => p.filter(c => c.id !== id))
    setKr(p => p.filter(c => c.id !== id))
    setVp(p => p.filter(c => c.id !== id))
    setCr(p => p.filter(c => c.id !== id))
    setCh(p => p.filter(c => c.id !== id))
    setCs(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setRev(p => p.filter(c => c.id !== id))
  }, [])

  const getList = useCallback((s: S) => {
    switch (s) {
      case 'bmc:key_partners': return kp
      case 'bmc:key_activities': return ka
      case 'bmc:key_resources': return kr
      case 'bmc:value_propositions': return vp
      case 'bmc:customer_relationships': return cr
      case 'bmc:channels': return ch
      case 'bmc:customer_segments': return cs
      case 'bmc:cost_structure': return cost
      case 'bmc:revenue_streams': return rev
      default: return []
    }
  }, [kp,ka,kr,vp,cr,ch,cs,cost,rev])

  const handleDrop = useCallback(async (targetStatus: S) => {
    // Same approach as kanban/matrix: rely on in-memory drag state + computed hover index
    const drag = dragging
    const target = dropTarget
    setDropTarget(null)
    setDragging(null)
    if (!drag) return
    const id = drag.id
    const from = drag.from
    const currentList = getList(targetStatus)
    let dropIndex = typeof target?.index === 'number' && target.status === targetStatus ? target.index : currentList.length
    const filtered = currentList.filter((c) => c.id !== id)
    if (dropIndex > filtered.length) dropIndex = filtered.length
    const newOrder = computeOrder(filtered, Math.max(0, Math.min(filtered.length, dropIndex)))
    await updateCard(id, from === targetStatus ? { order: newOrder } : { status: targetStatus, order: newOrder })
  }, [dragging, dropTarget, getList, computeOrder, updateCard])


  const onContainerDragOver = useCallback((status: S) => {
    setDropTarget((prev) => ({ status, index: prev?.status === status ? (prev.index ?? null) : null }))
  }, [])

  const commonBubbles = { minAge: 0, maxAge: 0, minRot: 0, maxRot: 0 }
  const TopGrid = () => (
    <div className="grid grid-cols-5 grid-rows-2 gap-4 h-full min-h-0">
      <div className="row-span-2">
        <BoardColumn
          title={`#${titles.kp}`}
          status="bmc:key_partners"
          isActive={dropTarget?.status === 'bmc:key_partners'}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={handleDrop}
        >
          {kp.map((c, idx) => (
<BoardCardItem key={c.id} card={c} index={idx} status={'bmc:key_partners'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} bubbleContext={{ kind: 'bmc:key_partners', ...commonBubbles }} hideBadges={true} />
          ))}
        </BoardColumn>
      </div>
      <div className="row-span-1">
        <BoardColumn
          title={`#${titles.ka}`}
          status="bmc:key_activities"
          isActive={dropTarget?.status === 'bmc:key_activities'}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={handleDrop}
        >
          {ka.map((c, idx) => (
<BoardCardItem key={c.id} card={c} index={idx} status={'bmc:key_activities'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} bubbleContext={{ kind: 'bmc:key_activities', ...commonBubbles }} hideBadges={true} />
          ))}
        </BoardColumn>
      </div>
      <div className="row-span-2">
        <BoardColumn
          title={`#${titles.vp}`}
          status="bmc:value_propositions"
          isActive={dropTarget?.status === 'bmc:value_propositions'}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={handleDrop}
        >
          {vp.map((c, idx) => (
<BoardCardItem key={c.id} card={c} index={idx} status={'bmc:value_propositions'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} bubbleContext={{ kind: 'bmc:value_propositions', ...commonBubbles }} hideBadges={true} />
          ))}
        </BoardColumn>
      </div>
      <div className="row-span-1">
        <BoardColumn
          title={`#${titles.cr}`}
          status="bmc:customer_relationships"
          isActive={dropTarget?.status === 'bmc:customer_relationships'}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={handleDrop}
        >
          {cr.map((c, idx) => (
<BoardCardItem key={c.id} card={c} index={idx} status={'bmc:customer_relationships'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} bubbleContext={{ kind: 'bmc:customer_relationships', ...commonBubbles }} hideBadges={true} />
          ))}
        </BoardColumn>
      </div>
      <div className="row-span-2">
        <BoardColumn
          title={`#${titles.cs}`}
          status="bmc:customer_segments"
          isActive={dropTarget?.status === 'bmc:customer_segments'}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={handleDrop}
        >
          {cs.map((c, idx) => (
<BoardCardItem key={c.id} card={c} index={idx} status={'bmc:customer_segments'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} bubbleContext={{ kind: 'bmc:customer_segments', ...commonBubbles }} hideBadges={true} />
          ))}
        </BoardColumn>
      </div>
      <div className="row-span-1 col-start-2">
        <BoardColumn
          title={`#${titles.kr}`}
          status="bmc:key_resources"
          isActive={dropTarget?.status === 'bmc:key_resources'}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={handleDrop}
        >
          {kr.map((c, idx) => (
<BoardCardItem key={c.id} card={c} index={idx} status={'bmc:key_resources'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} bubbleContext={{ kind: 'bmc:key_resources', ...commonBubbles }} hideBadges={true} />
          ))}
        </BoardColumn>
      </div>
      <div className="row-span-1 col-start-4">
        <BoardColumn
          title={`#${titles.ch}`}
          status="bmc:channels"
          isActive={dropTarget?.status === 'bmc:channels'}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={handleDrop}
        >
          {ch.map((c, idx) => (
<BoardCardItem key={c.id} card={c} index={idx} status={'bmc:channels'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} bubbleContext={{ kind: 'bmc:channels', ...commonBubbles }} hideBadges={true} />
          ))}
        </BoardColumn>
      </div>
    </div>
  )

  const BottomGrid = () => (
    <div className="grid grid-cols-2 gap-4 h-full min-h-0">
      <div>
        <BoardColumn
          title={`#${titles.cost}`}
          status="bmc:cost_structure"
          isActive={dropTarget?.status === 'bmc:cost_structure'}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={handleDrop}
        >
          {cost.map((c, idx) => (
<BoardCardItem key={c.id} card={c} index={idx} status={'bmc:cost_structure'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} bubbleContext={{ kind: 'bmc:cost_structure', ...commonBubbles }} hideBadges={true} />
          ))}
        </BoardColumn>
      </div>
      <div>
        <BoardColumn
          title={`#${titles.rev}`}
          status="bmc:revenue_streams"
          isActive={dropTarget?.status === 'bmc:revenue_streams'}
          onContainerDragOver={onContainerDragOver}
          onContainerDrop={handleDrop}
        >
          {rev.map((c, idx) => (
<BoardCardItem key={c.id} card={c} index={idx} status={'bmc:revenue_streams'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} bubbleContext={{ kind: 'bmc:revenue_streams', ...commonBubbles }} hideBadges={true} />
          ))}
        </BoardColumn>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col xl:h-full xl:min-h-0">
      <div className="flex-1 xl:min-h-0 grid gap-4" style={{ gridTemplateRows: '2fr 1fr' }}>
        <div className="min-h-0"><TopGrid /></div>
        <div className="min-h-0"><BottomGrid /></div>
      </div>
      <div className="pt-2 xl:pt-2">
        <BottomBar
          view={'business'}
          onCreate={createCard}
          onToggle={() => router.push('/kanban')}
          onArchiveNav={() => router.push('/archive')}
          onKanbanNav={() => router.push('/kanban')}
          onMatrixNav={() => router.push('/matrix')}
          onBusinessNav={() => router.push('/business')}
          showToggle={false}
          showArchive={true}
          showKanban={true}
          showMatrix={true}
          showBusiness={false}
          showAdmin={true}
          onAdminNav={() => router.push('/admin')}
        />
      </div>
    </div>
  )
}

