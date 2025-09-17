"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchJSON } from '@/lib/client'
import BottomBar from '@/components/BottomBar'
import { CardItem as BoardCardItem } from '@/components/Board'
import type { Card } from '@/types/card'
import { useSettings } from '@/lib/settings'
import { withAlpha } from '@/lib/color'

// ProofBoard: a dedicated 4-column board for /proof using proof buckets only.
// Buckets: #persona, #proposal, #journey, #backlog (titles rendered; underlying data stored in card.proof)
// DnD semantics are copied from the working matrix board (Board.tsx):
// - Drag over items sets insertion index before/after.
// - Drop computes neighbor-averaged order for proofOrder and persists via PATCH.
// Axis labels are removed entirely (#urgent, #not-urgent, #important, #not-important) for this board.
// All cards appear in #backlog by default (view shows all non-archived that are not explicitly assigned to persona/proposal/journey).
// Creating on /proof will set proof=Backlog; API defaults ensure other pages use their default boxes.

export default function ProofBoard() {
  const router = useRouter()
  const settings = useSettings()

  type PB = 'Persona' | 'Proposal' | 'Journey' | 'Backlog'

  const [persona, setPersona] = useState<Card[]>([])
  const [proposal, setProposal] = useState<Card[]>([])
  const [journey, setJourney] = useState<Card[]>([])
  const [backlog, setBacklog] = useState<Card[]>([])

  // Drag state tracks from which proof bucket the drag started and target container+index
  const [dragging, setDragging] = useState<{ id: string; from: PB } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ bucket: PB; index: number | null } | null>(null)

  const load = useCallback(async () => {
    // Fetch explicit proof buckets
    const [p, a, j, all] = await Promise.all([
      fetchJSON<Card[]>(`/api/cards?proof=Persona`),
      fetchJSON<Card[]>(`/api/cards?proof=Proposal`),
      fetchJSON<Card[]>(`/api/cards?proof=Journey`),
      fetchJSON<Card[]>(`/api/cards`), // all non-archived cards
    ])
    const ex = new Set<string>([...p, ...a, ...j].map((c) => c.id))
    const backlogList = all.filter((c) => !ex.has(c.id))
    setPersona(p)
    setProposal(a)
    setJourney(j)
    setBacklog(backlogList)
  }, [])

  useEffect(() => { load() }, [load])

  // Sorting by proofOrder then updatedAt desc
  type C = Card & { proof?: PB; proofOrder?: number }
  const byProofOrder = useCallback((x: C, y: C) => {
    const xo = Number.isFinite(x.proofOrder ?? NaN) ? (x.proofOrder as number) : Number.MAX_SAFE_INTEGER
    const yo = Number.isFinite(y.proofOrder ?? NaN) ? (y.proofOrder as number) : Number.MAX_SAFE_INTEGER
    if (xo !== yo) return xo - yo
    return new Date(y.updatedAt).getTime() - new Date(x.updatedAt).getTime()
  }, [])
  const insertSorted = useCallback((arr: C[]) => { const next = [...arr]; next.sort(byProofOrder); return next }, [byProofOrder])

  const computeOrder = useCallback((list: C[], dropIndex: number) => {
    const coerce = (val: unknown, idx: number) => {
      const n = typeof val === 'number' ? val : NaN
      return Number.isFinite(n) ? n : idx * 2
    }
    const prev = list[dropIndex - 1] || null
    const next = list[dropIndex] || null
    if (prev && next) {
      const prevO = coerce(prev.proofOrder, dropIndex - 1)
      const nextO = coerce(next.proofOrder, dropIndex)
      if (prevO < nextO) return (prevO + nextO) / 2
      return prevO + 1
    }
    if (!prev && next) return coerce(next.proofOrder, dropIndex) - 1
    if (prev && !next) return coerce(prev.proofOrder, dropIndex - 1) + 1
    return 0
  }, [])

  const updateCard = useCallback(async (id: string, data: Partial<Pick<Card, 'text'>> & { proof?: PB; proofOrder?: number }) => {
    const updated = await fetchJSON<Card>(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) as unknown as C
    // Remove from all lists first
    setPersona(p => p.filter(c => c.id !== id))
    setProposal(p => p.filter(c => c.id !== id))
    setJourney(p => p.filter(c => c.id !== id))
    setBacklog(p => p.filter(c => c.id !== id))
    // Insert into the new bucket or keep in backlog when undefined
    const bucketRaw = (updated.proof as unknown)
    const bucket: PB = bucketRaw === 'Persona' || bucketRaw === 'Proposal' || bucketRaw === 'Journey' ? bucketRaw : 'Backlog'
    const ins = bucket === 'Persona' ? setPersona : bucket === 'Proposal' ? setProposal : bucket === 'Journey' ? setJourney : setBacklog
    ins(prev => insertSorted([...prev as unknown as C[], updated as C]))
  }, [insertSorted])

  const onContainerDragOver = useCallback((bucket: PB) => {
    setDropTarget(prev => ({ bucket, index: prev?.bucket === bucket ? (prev.index ?? null) : null }))
  }, [])

  const handleDrop = useCallback(async (bucket: PB) => {
    const drag = dragging
    const target = dropTarget
    setDragging(null)
    setDropTarget(null)
    if (!drag) return
    const id = drag.id
    const current = bucket === 'Persona' ? persona : bucket === 'Proposal' ? proposal : bucket === 'Journey' ? journey : backlog
    let dropIndex = typeof target?.index === 'number' && target.bucket === bucket ? target.index : current.length
    const filtered = current.filter(c => c.id !== id)
    if (dropIndex > filtered.length) dropIndex = filtered.length
    const proofOrder = computeOrder(filtered as C[], Math.max(0, Math.min(filtered.length, dropIndex)))
    await updateCard(id, { proof: bucket, proofOrder })
  }, [dragging, dropTarget, persona, proposal, journey, backlog, computeOrder, updateCard])

  const createCard = useCallback(async (text: string) => {
    const created = await fetchJSON<Card>(`/api/cards`, { method: 'POST', body: JSON.stringify({ text, status: 'decide', proof: 'Backlog' }) }) as unknown as C
    setBacklog(prev => insertSorted([created as C, ...prev as unknown as C[]]))
  }, [insertSorted])

  const stats = useMemo(() => ({ minAge: 0, maxAge: 0, minRot: 0, maxRot: 0 }), [])

  // ProofColumn uses proof color group. Titles are rendered with proof colors.
  function ProofColumn({ title, bucket, children }: { title: string; bucket: PB; children: React.ReactNode }) {
    type ProofKey = 'persona'|'proposal'|'journey'|'backlog'
    const key = (title.replace('#','').toLowerCase()) as ProofKey
    const pc = (settings?.colors?.proof ?? {}) as Partial<Record<ProofKey, string>>
    const tc = (settings?.colors?.textContrast?.proof ?? {}) as Partial<Record<ProofKey, boolean>>
    const bg = pc[key] || '#ffffff'
    const fg = (tc[key] ?? true) ? '#000' : '#fff'
    return (
      <div
        className={`border rounded-lg p-3 xl:h-full xl:min-h-0 flex flex-col text-black ${dropTarget?.bucket === bucket ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-300'}`}
        style={{ backgroundColor: withAlpha(bg, 0.3) }}
        onDragOver={(e) => { e.preventDefault(); try { ((e as unknown as DragEvent).dataTransfer as DataTransfer).dropEffect = 'move' } catch {}; onContainerDragOver(bucket) }}
        onDragEnter={() => onContainerDragOver(bucket)}
        onDrop={(e) => { e.preventDefault(); handleDrop(bucket) }}
      >
        <div className="mb-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>{title}</span>
        </div>
        <div
          className="flex-1 space-y-2 overflow-auto pr-1"
          onDragOver={(e) => { e.preventDefault(); onContainerDragOver(bucket) }}
          onDragEnter={() => onContainerDragOver(bucket)}
          onDrop={(e) => { e.preventDefault(); handleDrop(bucket) }}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col xl:h-full xl:min-h-0">
      <div className="flex-1 xl:overflow-hidden xl:min-h-0 grid grid-cols-1 xl:grid-cols-2 xl:grid-rows-2 gap-4">
        <div className="min-h-0">
          <ProofColumn title="#persona" bucket={'Persona'}>
            {persona.map((c, idx) => (
              <BoardCardItem
                key={c.id}
                index={idx}
                status={c.status}
                card={c}
                onUpdate={(id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => updateCard(id, data)}
                onDelete={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'DELETE' }); setPersona(p => p.filter(x => x.id !== id)) }}
                onArchive={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) }); setPersona(p => p.filter(x => x.id !== id)) }}
                onHoverIndex={(t: { status: Card['status']; index: number | null }) => setDropTarget({ bucket: 'Persona', index: t.index })}
                bubbleContext={{ kind: c.status, ...stats }}
              onDragFlag={(d) => setDragging(d ? { id: (d as unknown as { id: string }).id, from: 'Persona' } : null)}
                extraChips={[`#${c.status}`, `#${(c as unknown as { business?: Card['business'] }).business || 'ValuePropositions'}`, `#${((c as unknown as { proof?: PB }).proof || 'Backlog').toLowerCase()}`]}
              />
            ))}
          </ProofColumn>
        </div>
        <div className="min-h-0">
          <ProofColumn title="#proposal" bucket={'Proposal'}>
            {proposal.map((c, idx) => (
              <BoardCardItem
                key={c.id}
                index={idx}
                status={c.status}
                card={c}
                onUpdate={(id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => updateCard(id, data)}
                onDelete={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'DELETE' }); setProposal(p => p.filter(x => x.id !== id)) }}
                onArchive={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) }); setProposal(p => p.filter(x => x.id !== id)) }}
                onHoverIndex={(t: { status: Card['status']; index: number | null }) => setDropTarget({ bucket: 'Proposal', index: t.index })}
                bubbleContext={{ kind: c.status, ...stats }}
              onDragFlag={(d) => setDragging(d ? { id: (d as unknown as { id: string }).id, from: 'Proposal' } : null)}
                extraChips={[`#${c.status}`, `#${(c as unknown as { business?: Card['business'] }).business || 'ValuePropositions'}`, `#${((c as unknown as { proof?: PB }).proof || 'Backlog').toLowerCase()}`]}
              />
            ))}
          </ProofColumn>
        </div>
        <div className="min-h-0">
          <ProofColumn title="#journey" bucket={'Journey'}>
            {journey.map((c, idx) => (
              <BoardCardItem
                key={c.id}
                index={idx}
                status={c.status}
                card={c}
                onUpdate={(id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => updateCard(id, data)}
                onDelete={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'DELETE' }); setJourney(p => p.filter(x => x.id !== id)) }}
                onArchive={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) }); setJourney(p => p.filter(x => x.id !== id)) }}
                onHoverIndex={(t: { status: Card['status']; index: number | null }) => setDropTarget({ bucket: 'Journey', index: t.index })}
                bubbleContext={{ kind: c.status, ...stats }}
              onDragFlag={(d) => setDragging(d ? { id: (d as unknown as { id: string }).id, from: 'Journey' } : null)}
                extraChips={[`#${c.status}`, `#${(c as unknown as { business?: Card['business'] }).business || 'ValuePropositions'}`, `#${((c as unknown as { proof?: PB }).proof || 'Backlog').toLowerCase()}`]}
              />
            ))}
          </ProofColumn>
        </div>
        <div className="min-h-0">
          <ProofColumn title="#backlog" bucket={'Backlog'}>
            {backlog.map((c, idx) => (
              <BoardCardItem
                key={c.id}
                index={idx}
                status={c.status}
                card={c}
                onUpdate={(id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => updateCard(id, data)}
                onDelete={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'DELETE' }); setBacklog(p => p.filter(x => x.id !== id)) }}
                onArchive={async (id: string) => { await fetchJSON(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) }); setBacklog(p => p.filter(x => x.id !== id)) }}
                onHoverIndex={(t: { status: Card['status']; index: number | null }) => setDropTarget({ bucket: 'Backlog', index: t.index })}
                bubbleContext={{ kind: c.status, ...stats }}
              onDragFlag={(d) => setDragging(d ? { id: (d as unknown as { id: string }).id, from: 'Backlog' } : null)}
                extraChips={[`#${c.status}`, `#${(c as unknown as { business?: Card['business'] }).business || 'ValuePropositions'}`, `#${((c as unknown as { proof?: PB }).proof || 'Backlog').toLowerCase()}`]}
              />
            ))}
          </ProofColumn>
        </div>
      </div>

      <BottomBar
        view={'kanban'}
        onCreate={createCard}
        onToggle={() => router.push('/kanban')}
        onArchiveNav={() => router.push('/archive')}
        onKanbanNav={() => router.push('/kanban')}
        onMatrixNav={() => router.push('/matrix')}
        onBusinessNav={() => router.push('/business')}
        onProofNav={() => router.push('/proof')}
        showToggle={false}
        showArchive={true}
        showKanban={true}
        showMatrix={true}
        showBusiness={true}
        showProof={true}
        showAdmin={true}
        onAdminNav={() => router.push('/admin')}
      />
    </div>
  )
}
