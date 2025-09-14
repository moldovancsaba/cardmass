"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchJSON } from '@/lib/client'
import type { Card } from '@/types/card'
import BottomBar from '@/components/BottomBar'
import { Column as BoardColumn, CardItem as BoardCardItem } from '@/components/Board'

// BusinessBoard: simplified 3-column board copied from Kanban behavior
// Columns: ValuePropositions, KeyActivities, KeyResources
// Behavior:
// - All active matrix cards (delegate, decide, do, decline) appear in ValuePropositions by default
// - Cards carry #matrix status chip and #business chip; chips auto-update on state changes
// - Drag-and-drop reorders within business columns and moves across them (business + businessOrder)
// - Deleting/archiving reflects globally
export default function BusinessBoard() {
  const router = useRouter()
  type B = 'KeyPartners' | 'KeyActivities' | 'KeyResources' | 'ValuePropositions' | 'CustomerRelationships' | 'Channels' | 'CustomerSegments' | 'Cost' | 'RevenueStream'

  const [kp, setKp] = useState<Card[]>([])
  const [ka, setKa] = useState<Card[]>([])
  const [kr, setKr] = useState<Card[]>([])
  const [vp, setVp] = useState<Card[]>([])
  const [rel, setRel] = useState<Card[]>([])
  const [ch, setCh] = useState<Card[]>([])
  const [seg, setSeg] = useState<Card[]>([])
  const [cost, setCost] = useState<Card[]>([])
  const [rev, setRev] = useState<Card[]>([])

  type Status = Card['status']
  const [dragging, setDragging] = useState<{ id: string; from: B } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ bucket: B; index: number | null } | null>(null)

  const load = useCallback(async () => {
    // fetch by business bucket
    const [a, b, c, d, e, f, g, h, i] = await Promise.all([
      fetchJSON<Card[]>(`/api/cards?business=KeyPartners`),
      fetchJSON<Card[]>(`/api/cards?business=KeyActivities`),
      fetchJSON<Card[]>(`/api/cards?business=KeyResources`),
      fetchJSON<Card[]>(`/api/cards?business=ValuePropositions`),
      fetchJSON<Card[]>(`/api/cards?business=CustomerRelationships`),
      fetchJSON<Card[]>(`/api/cards?business=Channels`),
      fetchJSON<Card[]>(`/api/cards?business=CustomerSegments`),
      fetchJSON<Card[]>(`/api/cards?business=Cost`),
      fetchJSON<Card[]>(`/api/cards?business=RevenueStream`),
    ])
    setKp(a)
    setKa(b)
    setKr(c)
    setVp(d)
    setRel(e)
    setCh(f)
    setSeg(g)
    setCost(h)
    setRev(i)
  }, [])
  useEffect(() => { load() }, [load])

  const byBizOrder = useCallback((a: Card, b: Card) => {
    const aoRaw = (a as unknown as { businessOrder?: number }).businessOrder
    const boRaw = (b as unknown as { businessOrder?: number }).businessOrder
    const ao = Number.isFinite(aoRaw ?? NaN) ? (aoRaw as number) : Number.MAX_SAFE_INTEGER
    const bo = Number.isFinite(boRaw ?? NaN) ? (boRaw as number) : Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  }, [])
  const insertSorted = useCallback((arr: Card[]) => { const next = [...arr]; next.sort(byBizOrder); return next }, [byBizOrder])

  const computeOrder = useCallback((list: Card[], dropIndex: number) => {
    const prev = list[dropIndex - 1] || null
    const next = list[dropIndex] || null
    const prevO = (prev as unknown as { businessOrder?: number })?.businessOrder ?? null
    const nextO = (next as unknown as { businessOrder?: number })?.businessOrder ?? null
    if (prev && next && prevO! < nextO!) return (prevO! + nextO!) / 2
    if (!prev && next) return nextO! - 1
    if (prev && !next) return prevO! + 1
    return 0
  }, [])

  const updateCard = useCallback(async (id: string, data: Partial<Pick<Card, 'text' | 'status'>> & { business?: B; businessOrder?: number }) => {
    const updated = await fetchJSON<Card>(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    // remove from all
    setKp(p => p.filter(c => c.id !== id))
    setKa(p => p.filter(c => c.id !== id))
    setKr(p => p.filter(c => c.id !== id))
    setVp(p => p.filter(c => c.id !== id))
    setRel(p => p.filter(c => c.id !== id))
    setCh(p => p.filter(c => c.id !== id))
    setSeg(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setRev(p => p.filter(c => c.id !== id))
    // insert back according to updated.business
    const biz = (updated as unknown as { business?: B }).business || 'ValuePropositions'
    if (biz === 'KeyPartners') setKp(a => insertSorted([...a, updated]))
    if (biz === 'KeyActivities') setKa(a => insertSorted([...a, updated]))
    if (biz === 'KeyResources') setKr(a => insertSorted([...a, updated]))
    if (biz === 'ValuePropositions') setVp(a => insertSorted([...a, updated]))
    if (biz === 'CustomerRelationships') setRel(a => insertSorted([...a, updated]))
    if (biz === 'Channels') setCh(a => insertSorted([...a, updated]))
    if (biz === 'CustomerSegments') setSeg(a => insertSorted([...a, updated]))
    if (biz === 'Cost') setCost(a => insertSorted([...a, updated]))
    if (biz === 'RevenueStream') setRev(a => insertSorted([...a, updated]))
  }, [insertSorted])

  const archiveCard = useCallback(async (id: string) => {
    await fetchJSON(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) })
    setKp(p => p.filter(c => c.id !== id))
    setKa(p => p.filter(c => c.id !== id))
    setKr(p => p.filter(c => c.id !== id))
    setVp(p => p.filter(c => c.id !== id))
    setRel(p => p.filter(c => c.id !== id))
    setCh(p => p.filter(c => c.id !== id))
    setSeg(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setRev(p => p.filter(c => c.id !== id))
  }, [])

  const deleteCard = useCallback(async (id: string) => {
    await fetchJSON(`/api/cards/${id}`, { method: 'DELETE' })
    setKp(p => p.filter(c => c.id !== id))
    setKa(p => p.filter(c => c.id !== id))
    setKr(p => p.filter(c => c.id !== id))
    setVp(p => p.filter(c => c.id !== id))
    setRel(p => p.filter(c => c.id !== id))
    setCh(p => p.filter(c => c.id !== id))
    setSeg(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setRev(p => p.filter(c => c.id !== id))
  }, [])

  const onContainerDragOver = useCallback((bucket: B) => {
    setDropTarget(prev => ({ bucket, index: prev?.bucket === bucket ? (prev.index ?? null) : null }))
  }, [])

  const handleDrop = useCallback(async (bucket: B) => {
    const drag = dragging
    const target = dropTarget
    setDragging(null)
    setDropTarget(null)
    if (!drag) return
    const id = drag.id
    const current = bucket === 'KeyPartners' ? kp : bucket === 'KeyActivities' ? ka : bucket === 'KeyResources' ? kr : bucket === 'ValuePropositions' ? vp : bucket === 'CustomerRelationships' ? rel : bucket === 'Channels' ? ch : bucket === 'CustomerSegments' ? seg : bucket === 'Cost' ? cost : rev
    let dropIndex = typeof target?.index === 'number' && target.bucket === bucket ? target.index : current.length
    const filtered = current.filter(c => c.id !== id)
    if (dropIndex > filtered.length) dropIndex = filtered.length
    const businessOrder = computeOrder(filtered, Math.max(0, Math.min(filtered.length, dropIndex)))
    await updateCard(id, { business: bucket, businessOrder })
  }, [dragging, dropTarget, kp, ka, kr, vp, rel, ch, seg, cost, rev, computeOrder, updateCard])

  const stats = useMemo(() => ({ minAge: 0, maxAge: 0, minRot: 0, maxRot: 0 }), [])

function chipsForCard(card: Card) {
    const matrix = `#${card.status}`
    const bizVal = (card as unknown as { business?: B }).business || 'ValuePropositions'
    const business = `#${bizVal}`
    // Always show both chips for clarity
    return [matrix, business]
  }

  return (
    <div className="relative flex flex-col xl:h-full xl:min-h-0">
      <div className="flex-1 xl:min-h-0 grid gap-4" style={{ gridTemplateRows: '2fr 1fr' }}>
        <div className="min-h-0">
          <div className="grid grid-cols-5 grid-rows-2 gap-4 h-full min-h-0 relative">
            <div className="row-span-2">
              <BoardColumn title="#KeyPartners" status={"bmc:key_partners" as unknown as Card['status']} isActive={dropTarget?.bucket === 'KeyPartners'} onContainerDragOver={() => onContainerDragOver('KeyPartners')} onContainerDrop={() => handleDrop('KeyPartners')}>
                {kp.map((c, idx) => (
                  <BoardCardItem key={c.id} index={idx} status={c.status} card={c} onUpdate={(id, data) => updateCard(id, data)} onDelete={deleteCard} onArchive={archiveCard} onHoverIndex={(t) => setDropTarget({ bucket: 'KeyPartners', index: t.index })} bubbleContext={{ kind: c.status as Status, ...stats }} onDragFlag={() => setDragging({ id: c.id, from: 'KeyPartners' })} extraChips={chipsForCard(c)} />
                ))}
              </BoardColumn>
            </div>
            <div className="row-span-1">
              <BoardColumn title="#KeyActivities" status={"bmc:key_activities" as unknown as Card['status']} isActive={dropTarget?.bucket === 'KeyActivities'} onContainerDragOver={() => onContainerDragOver('KeyActivities')} onContainerDrop={() => handleDrop('KeyActivities')}>
                {ka.map((c, idx) => (
                  <BoardCardItem key={c.id} index={idx} status={c.status} card={c} onUpdate={(id, data) => updateCard(id, data)} onDelete={deleteCard} onArchive={archiveCard} onHoverIndex={(t) => setDropTarget({ bucket: 'KeyActivities', index: t.index })} bubbleContext={{ kind: c.status as Status, ...stats }} onDragFlag={() => setDragging({ id: c.id, from: 'KeyActivities' })} extraChips={chipsForCard(c)} />
                ))}
              </BoardColumn>
            </div>
            <div className="row-span-2">
              <BoardColumn title="#ValuePropositions" status={"bmc:value_propositions" as unknown as Card['status']} isActive={dropTarget?.bucket === 'ValuePropositions'} onContainerDragOver={() => onContainerDragOver('ValuePropositions')} onContainerDrop={() => handleDrop('ValuePropositions')}>
                {vp.map((c, idx) => (
                  <BoardCardItem key={c.id} index={idx} status={c.status} card={c} onUpdate={(id, data) => updateCard(id, data)} onDelete={deleteCard} onArchive={archiveCard} onHoverIndex={(t) => setDropTarget({ bucket: 'ValuePropositions', index: t.index })} bubbleContext={{ kind: c.status as Status, ...stats }} onDragFlag={() => setDragging({ id: c.id, from: 'ValuePropositions' })} extraChips={chipsForCard(c)} />
                ))}
              </BoardColumn>
            </div>
            <div className="row-span-1">
              <BoardColumn title="#CustomerRelationships" status={"bmc:customer_relationships" as unknown as Card['status']} isActive={dropTarget?.bucket === 'CustomerRelationships'} onContainerDragOver={() => onContainerDragOver('CustomerRelationships')} onContainerDrop={() => handleDrop('CustomerRelationships')}>
                {rel.map((c, idx) => (
                  <BoardCardItem key={c.id} index={idx} status={c.status} card={c} onUpdate={(id, data) => updateCard(id, data)} onDelete={deleteCard} onArchive={archiveCard} onHoverIndex={(t) => setDropTarget({ bucket: 'CustomerRelationships', index: t.index })} bubbleContext={{ kind: c.status as Status, ...stats }} onDragFlag={() => setDragging({ id: c.id, from: 'CustomerRelationships' })} extraChips={chipsForCard(c)} />
                ))}
              </BoardColumn>
            </div>
            <div className="row-span-2">
              <BoardColumn title="#CustomerSegments" status={"bmc:customer_segments" as unknown as Card['status']} isActive={dropTarget?.bucket === 'CustomerSegments'} onContainerDragOver={() => onContainerDragOver('CustomerSegments')} onContainerDrop={() => handleDrop('CustomerSegments')}>
                {seg.map((c, idx) => (
                  <BoardCardItem key={c.id} index={idx} status={c.status} card={c} onUpdate={(id, data) => updateCard(id, data)} onDelete={deleteCard} onArchive={archiveCard} onHoverIndex={(t) => setDropTarget({ bucket: 'CustomerSegments', index: t.index })} bubbleContext={{ kind: c.status as Status, ...stats }} onDragFlag={() => setDragging({ id: c.id, from: 'CustomerSegments' })} extraChips={chipsForCard(c)} />
                ))}
              </BoardColumn>
            </div>
            <div className="row-span-1 col-start-2">
              <BoardColumn title="#KeyResources" status={"bmc:key_resources" as unknown as Card['status']} isActive={dropTarget?.bucket === 'KeyResources'} onContainerDragOver={() => onContainerDragOver('KeyResources')} onContainerDrop={() => handleDrop('KeyResources')}>
                {kr.map((c, idx) => (
                  <BoardCardItem key={c.id} index={idx} status={c.status} card={c} onUpdate={(id, data) => updateCard(id, data)} onDelete={deleteCard} onArchive={archiveCard} onHoverIndex={(t) => setDropTarget({ bucket: 'KeyResources', index: t.index })} bubbleContext={{ kind: c.status as Status, ...stats }} onDragFlag={() => setDragging({ id: c.id, from: 'KeyResources' })} extraChips={chipsForCard(c)} />
                ))}
              </BoardColumn>
            </div>
            <div className="row-span-1 col-start-4">
              <BoardColumn title="#Channels" status={"bmc:channels" as unknown as Card['status']} isActive={dropTarget?.bucket === 'Channels'} onContainerDragOver={() => onContainerDragOver('Channels')} onContainerDrop={() => handleDrop('Channels')}>
                {ch.map((c, idx) => (
                  <BoardCardItem key={c.id} index={idx} status={c.status} card={c} onUpdate={(id, data) => updateCard(id, data)} onDelete={deleteCard} onArchive={archiveCard} onHoverIndex={(t) => setDropTarget({ bucket: 'Channels', index: t.index })} bubbleContext={{ kind: c.status as Status, ...stats }} onDragFlag={() => setDragging({ id: c.id, from: 'Channels' })} extraChips={chipsForCard(c)} />
                ))}
              </BoardColumn>
            </div>
          </div>
        </div>
        <div className="min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-0 relative">
            <BoardColumn title="#Cost" status={"bmc:cost_structure" as unknown as Card['status']} isActive={dropTarget?.bucket === 'Cost'} onContainerDragOver={() => onContainerDragOver('Cost')} onContainerDrop={() => handleDrop('Cost')}>
              {cost.map((c, idx) => (
                <BoardCardItem key={c.id} index={idx} status={c.status} card={c} onUpdate={(id, data) => updateCard(id, data)} onDelete={deleteCard} onArchive={archiveCard} onHoverIndex={(t) => setDropTarget({ bucket: 'Cost', index: t.index })} bubbleContext={{ kind: c.status as Status, ...stats }} onDragFlag={() => setDragging({ id: c.id, from: 'Cost' })} extraChips={chipsForCard(c)} />
              ))}
            </BoardColumn>
            <BoardColumn title="#RevenueStream" status={"bmc:revenue_streams" as unknown as Card['status']} isActive={dropTarget?.bucket === 'RevenueStream'} onContainerDragOver={() => onContainerDragOver('RevenueStream')} onContainerDrop={() => handleDrop('RevenueStream')}>
              {rev.map((c, idx) => (
                <BoardCardItem key={c.id} index={idx} status={c.status} card={c} onUpdate={(id, data) => updateCard(id, data)} onDelete={deleteCard} onArchive={archiveCard} onHoverIndex={(t) => setDropTarget({ bucket: 'RevenueStream', index: t.index })} bubbleContext={{ kind: c.status as Status, ...stats }} onDragFlag={() => setDragging({ id: c.id, from: 'RevenueStream' })} extraChips={chipsForCard(c)} />
              ))}
            </BoardColumn>
          </div>
        </div>
      </div>

      <BottomBar
        view={'business'}
        onCreate={async (text) => {
          // new cards go to ValuePropositions bucket by default, keep status unchanged default (decide) in API
          const created = await fetchJSON<Card>(`/api/cards`, { method: 'POST', body: JSON.stringify({ text, business: 'ValuePropositions' }) })
          setVp(prev => insertSorted([created, ...prev]))
        }}
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
  )
}
