"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import BottomBar from '@/components/BottomBar'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/lib/settings'
import { fetchJSON } from '@/lib/client'
import type { Card } from '@/types/card'
import { daysBetweenUtc } from '@/lib/date'
import { interpolateColor } from '@/lib/color'

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

  const TopGrid = () => (
    <div className="grid grid-cols-5 gap-4">
      {/* Col 1 merged rows */}
      <CanvasBlock title={titles.kp} status={'bmc:key_partners'} rows={2} onDrop={handleDrop} onDragOver={onContainerDragOver}>
        {kp.map((c, idx) => <CardItem key={c.id} card={c} index={idx} status={'bmc:key_partners'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} />)}
      </CanvasBlock>
      {/* Col 2 split rows */}
      <div className="flex flex-col gap-4">
        <CanvasBlock title={titles.ka} status={'bmc:key_activities'} rows={1} onDrop={handleDrop} onDragOver={onContainerDragOver}>
          {ka.map((c, idx) => <CardItem key={c.id} card={c} index={idx} status={'bmc:key_activities'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} />)}
        </CanvasBlock>
        <CanvasBlock title={titles.kr} status={'bmc:key_resources'} rows={1} onDrop={handleDrop} onDragOver={onContainerDragOver}>
          {kr.map((c, idx) => <CardItem key={c.id} card={c} index={idx} status={'bmc:key_resources'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} />)}
        </CanvasBlock>
      </div>
      {/* Col 3 merged */}
      <CanvasBlock title={titles.vp} status={'bmc:value_propositions'} rows={2} onDrop={handleDrop} onDragOver={onContainerDragOver}>
        {vp.map((c, idx) => <CardItem key={c.id} card={c} index={idx} status={'bmc:value_propositions'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} />)}
      </CanvasBlock>
      {/* Col 4 split */}
      <div className="flex flex-col gap-4">
        <CanvasBlock title={titles.cr} status={'bmc:customer_relationships'} rows={1} onDrop={handleDrop} onDragOver={onContainerDragOver}>
          {cr.map((c, idx) => <CardItem key={c.id} card={c} index={idx} status={'bmc:customer_relationships'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} />)}
        </CanvasBlock>
        <CanvasBlock title={titles.ch} status={'bmc:channels'} rows={1} onDrop={handleDrop} onDragOver={onContainerDragOver}>
          {ch.map((c, idx) => <CardItem key={c.id} card={c} index={idx} status={'bmc:channels'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} />)}
        </CanvasBlock>
      </div>
      {/* Col 5 merged */}
      <CanvasBlock title={titles.cs} status={'bmc:customer_segments'} rows={2} onDrop={handleDrop} onDragOver={onContainerDragOver}>
        {cs.map((c, idx) => <CardItem key={c.id} card={c} index={idx} status={'bmc:customer_segments'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} />)}
      </CanvasBlock>
    </div>
  )

  const BottomGrid = () => (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <CanvasBlock title={titles.cost} status={'bmc:cost_structure'} rows={1} onDrop={handleDrop} onDragOver={onContainerDragOver}>
        {cost.map((c, idx) => <CardItem key={c.id} card={c} index={idx} status={'bmc:cost_structure'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} />)}
      </CanvasBlock>
      <CanvasBlock title={titles.rev} status={'bmc:revenue_streams'} rows={1} onDrop={handleDrop} onDragOver={onContainerDragOver}>
        {rev.map((c, idx) => <CardItem key={c.id} card={c} index={idx} status={'bmc:revenue_streams'} onHoverIndex={setDropTarget} onDragFlag={setDragging} onUpdate={updateCard} onArchive={archiveCard} onDelete={deleteCard} />)}
      </CanvasBlock>
    </div>
  )

  return (
    <div className="flex flex-col xl:h-full xl:min-h-0">
      <div className="flex-1 xl:overflow-auto xl:min-h-0 space-y-4">
        <TopGrid />
        <BottomGrid />
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

function CanvasBlock({ title, status, rows, onDrop, onDragOver, children }: {
  title: string
  status: Card['status']
  rows: 1 | 2
  onDrop: (s: Card['status']) => void
  onDragOver: (s: Card['status']) => void
  children: React.ReactNode
}) {
  return (
    <div
className={`border rounded-lg p-3 text-black bg-white ${rows===2 ? 'row-span-2' : ''} border-gray-300`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(status) }}
      onDragEnter={() => onDragOver(status)}
      onDrop={(e) => { e.preventDefault(); onDrop(status) }}
    >
      <div className="text-sm font-mono text-black mb-2">#{title}</div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function CardItem({ card, index, status, onHoverIndex, onDragFlag, onUpdate, onArchive, onDelete }: {
  card: Card
  index: number
  status: Card['status']
  onHoverIndex: (t: { status: Card['status'], index: number | null }) => void
  onDragFlag: (d: { id: string; from: Card['status'] } | null) => void
  onUpdate: (id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => Promise<void>
  onArchive: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(card.text)
  useEffect(() => setText(card.text), [card.text])

  const daysOld = useMemo(() => daysBetweenUtc(card.createdAt), [card.createdAt])
  const rottenDays = useMemo(() => daysBetweenUtc(card.updatedAt), [card.updatedAt])

  const ageMs = useMemo(() => Date.now() - new Date(card.createdAt).getTime(), [card.createdAt])
  const rotMs = useMemo(() => Date.now() - new Date(card.updatedAt).getTime(), [card.updatedAt])
  const ageColor = useMemo(() => interpolateColor('#0a3d91', '#9ecbff', 1), [])
  const rotColor = useMemo(() => interpolateColor('#2ecc71', '#8e5b3a', 0), [])

  return (
    <div
      className="border border-gray-300 rounded-md p-3 bg-white text-black"
      draggable={!editing}
      onDragStart={(e) => {
        if (editing) return
        try { e.dataTransfer.setData('application/x-cardmass', JSON.stringify({ id: card.id, fromStatus: status, fromIndex: index })) } catch {}
        e.dataTransfer.effectAllowed = 'move'
        onDragFlag({ id: card.id, from: status })
      }}
      onDragEnd={() => onDragFlag(null)}
      onDragOver={(e) => {
        e.preventDefault()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const after = (e.clientY - rect.top) > rect.height / 2
        const targetIndex = index + (after ? 1 : 0)
        onHoverIndex({ status, index: targetIndex })
      }}
    >
      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-none outline-none bg-white text-black"
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              const t = text.trim()
              if (!t) return
              await onUpdate(card.id, { text: t })
              setEditing(false)
            } else if (e.key === 'Escape') {
              e.preventDefault()
              setText(card.text)
              setEditing(false)
            }
          }}
        />
      ) : (
        <div className="whitespace-pre-wrap text-sm text-black">{card.text}</div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-700">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: ageColor }}>
            #{daysOld} days old
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: rotColor }}>
            #rotten for {rottenDays} days
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={async () => { await onArchive(card.id) }} className="text-gray-700 hover:underline" aria-label="Archive card">archive</button>
          <button onClick={() => setEditing((v) => !v)} className="text-blue-600 hover:underline" aria-label="Edit text">{editing ? 'cancel' : 'edit'}</button>
          <button onClick={() => onDelete(card.id)} className="text-red-600 hover:underline" aria-label="Delete card">delete</button>
        </div>
      </div>
    </div>
  )
}
