"use client"

import { useCallback, useEffect, useState } from 'react'
import { fetchJSON } from '@/lib/client'
import { useRouter } from 'next/navigation'
import BottomBar from '@/components/BottomBar'
import type { Card } from '@/types/card'
import type { ProofBucket } from '@/types/proof'
import { useSettings } from '@/lib/settings'
import { withAlpha } from '@/lib/color'

// /proof page implements a 3x3 layout extended from matrix:
// Row1: #Persona | #Proposal | #Outcome
// Row2: #Benefit | #decide | #Decline
// Row3: #Journey | #Validation | #Cost
// All containers are droppable and have the same DnD semantics as Kanban/Matrix.
// New cards created anywhere default into Backlog until user moves them.

export default function ProofPage() {
  const router = useRouter()
  const settings = useSettings()

  // Buckets
  const [persona, setPersona] = useState<Card[]>([])
  const [proposal, setProposal] = useState<Card[]>([])
  const [outcome, setOutcome] = useState<Card[]>([])
  const [benefit, setBenefit] = useState<Card[]>([])
  const [journey, setJourney] = useState<Card[]>([])
  const [validation, setValidation] = useState<Card[]>([])
  const [cost, setCost] = useState<Card[]>([])
  const [backlog, setBacklog] = useState<Card[]>([])
  const [decide, setDecide] = useState<Card[]>([])
  const [decline, setDecline] = useState<Card[]>([])

  // Drag state (mirrors Board.tsx style but specific to proof buckets)
  const [dragging, setDragging] = useState<{ id: string; from: ProofBucket } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ bucket: ProofBucket; index: number | null } | null>(null)


  const getList = useCallback((b: ProofBucket) => {
    return b === 'Persona' ? persona
      : b === 'Proposal' ? proposal
      : b === 'Outcome' ? outcome
      : b === 'Benefit' ? benefit
      : b === 'decide' ? decide
      : b === 'decline' ? decline
      : b === 'Backlog' ? backlog
      : b === 'Journey' ? journey
      : b === 'Validation' ? validation
      : cost
  }, [persona, proposal, outcome, benefit, decide, decline, backlog, journey, validation, cost])

  const setList = useCallback((b: ProofBucket) => {
    return b === 'Persona' ? setPersona
      : b === 'Proposal' ? setProposal
      : b === 'Outcome' ? setOutcome
      : b === 'Benefit' ? setBenefit
      : b === 'decide' ? setDecide
      : b === 'decline' ? setDecline
      : b === 'Backlog' ? setBacklog
      : b === 'Journey' ? setJourney
      : b === 'Validation' ? setValidation
      : setCost
  }, [])

  const load = useCallback(async () => {
    // Helper to dedupe by id when merging queries
    const byId = (arr: Card[]) => {
      const m = new Map<string, Card>()
      for (const c of arr) m.set(c.id, c)
      return Array.from(m.values())
    }
    const [a, b, c, d, backlogList, j, v, costProof, costBiz, decProof, decStatus, dclProof, dclStatus] = await Promise.all([
      fetchJSON<Card[]>(`/api/cards?proof=Persona`),
      fetchJSON<Card[]>(`/api/cards?proof=Proposal`),
      fetchJSON<Card[]>(`/api/cards?proof=Outcome`),
      fetchJSON<Card[]>(`/api/cards?proof=Benefit`),
      fetchJSON<Card[]>(`/api/cards?proof=Backlog`),
      fetchJSON<Card[]>(`/api/cards?proof=Journey`),
      fetchJSON<Card[]>(`/api/cards?proof=Validation`),
      fetchJSON<Card[]>(`/api/cards?proof=Cost`),
      fetchJSON<Card[]>(`/api/cards?business=Cost`),
      fetchJSON<Card[]>(`/api/cards?proof=decide`),
      fetchJSON<Card[]>(`/api/cards?status=decide`),
      fetchJSON<Card[]>(`/api/cards?proof=decline`),
      fetchJSON<Card[]>(`/api/cards?status=decline`),
    ])
    setPersona(a)
    setProposal(b)
    setOutcome(c)
    setBenefit(d)
    setBacklog(backlogList)
    setJourney(j)
    setValidation(v)
    setCost(byId([...costProof, ...costBiz]))
    setDecide(byId([...decProof, ...decStatus]))
    setDecline(byId([...dclProof, ...dclStatus]))
  }, [])

  useEffect(() => { load() }, [load])

  type C = Card & { proof?: ProofBucket; proofOrder?: number }
  const byProofOrder = useCallback((a: C, b: C) => {
    const aoNum = Number.isFinite(a.proofOrder ?? NaN) ? (a.proofOrder as number) : Number.MAX_SAFE_INTEGER
    const boNum = Number.isFinite(b.proofOrder ?? NaN) ? (b.proofOrder as number) : Number.MAX_SAFE_INTEGER
    if (aoNum !== boNum) return aoNum - boNum
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  }, [])
  const insertSorted = useCallback((arr: C[]) => { const next = [...arr]; next.sort(byProofOrder); return next }, [byProofOrder])

  const computeOrder = useCallback((list: C[], dropIndex: number) => {
    const prev = list[dropIndex - 1] || null
    const next = list[dropIndex] || null
    const prevO = prev?.proofOrder ?? null
    const nextO = next?.proofOrder ?? null
    if (prev && next && prevO! < nextO!) return (prevO! + nextO!) / 2
    if (!prev && next) return nextO! - 1
    if (prev && !next) return prevO! + 1
    return 0
  }, [])

  const updateCard = useCallback(async (id: string, data: Partial<Pick<Card, 'text'>> & { proof?: ProofBucket; proofOrder?: number }) => {
    const updated = await fetchJSON<Card>(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) as unknown as C
    // Remove from all, then insert back
    setBenefit(p => p.filter(c => c.id !== id))
    setBacklog(p => p.filter(c => c.id !== id))
    setDecide(p => p.filter(c => c.id !== id))
    setDecline(p => p.filter(c => c.id !== id))
    setJourney(p => p.filter(c => c.id !== id))
    setValidation(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setValidation(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setBacklog(p => p.filter(c => c.id !== id))
    const bucket = updated.proof as ProofBucket | undefined
    const ins = setList(bucket || 'Benefit')
    ins(prev => insertSorted([...prev, updated]))
  }, [insertSorted, setList])

  const deleteCard = useCallback(async (id: string) => {
    await fetchJSON(`/api/cards/${id}`, { method: 'DELETE' })
    setPersona(p => p.filter(c => c.id !== id))
    setProposal(p => p.filter(c => c.id !== id))
    setOutcome(p => p.filter(c => c.id !== id))
    setBenefit(p => p.filter(c => c.id !== id))
    setJourney(p => p.filter(c => c.id !== id))
    setValidation(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
  }, [])

  const archiveCard = useCallback(async (id: string) => {
    await fetchJSON(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) })
    setBenefit(p => p.filter(c => c.id !== id))
    setBacklog(p => p.filter(c => c.id !== id))
    setDecide(p => p.filter(c => c.id !== id))
    setDecline(p => p.filter(c => c.id !== id))
    setJourney(p => p.filter(c => c.id !== id))
    setValidation(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setValidation(p => p.filter(c => c.id !== id))
    setCost(p => p.filter(c => c.id !== id))
    setBacklog(p => p.filter(c => c.id !== id))
  }, [])

  const handleDrop = useCallback(async (bucket: ProofBucket) => {
    const drag = dragging
    const target = dropTarget
    setDragging(null)
    setDropTarget(null)
    if (!drag) return
    const id = drag.id
    const current = getList(bucket)
    let dropIndex = typeof target?.index === 'number' && target.bucket === bucket ? target.index : current.length
    const filtered = current.filter(c => c.id !== id)
    if (dropIndex > filtered.length) dropIndex = filtered.length
    const proofOrder = computeOrder(filtered, Math.max(0, Math.min(filtered.length, dropIndex)))
    await updateCard(id, { proof: bucket, proofOrder })
  }, [dragging, dropTarget, getList, computeOrder, updateCard])

  const onContainerDragOver = useCallback((bucket: ProofBucket) => {
    setDropTarget(prev => ({ bucket, index: prev?.bucket === bucket ? (prev.index ?? null) : null }))
  }, [])

  const createCard = useCallback(async (text: string) => {
    const created = await fetchJSON<Card>(`/api/cards`, { method: 'POST', body: JSON.stringify({ text, proof: 'Backlog' }) }) as unknown as C
    setBacklog(prev => insertSorted([created, ...prev]))
  }, [insertSorted])

  type ProofKey = 'persona'|'proposal'|'outcome'|'benefit'|'decide'|'decline'|'backlog'|'journey'|'validation'|'cost'
  function titleToKey(title: string): ProofKey {
    switch (title) {
      case 'Persona': return 'persona'
      case 'Proposal': return 'proposal'
      case 'Outcome': return 'outcome'
      case 'Benefit': return 'benefit'
      case 'decide': return 'decide'
      case 'Decline': return 'decline'
      case 'Backlog': return 'backlog'
      case 'Journey': return 'journey'
      case 'Validation': return 'validation'
      default: return 'cost'
    }
  }
  function proofChip(label: string) {
    const key = titleToKey(label)
    type ProofColors = Partial<Record<ProofKey, string>>
    type ProofContrast = Partial<Record<ProofKey, boolean>>
    const pc = (settings?.colors?.proof ?? {}) as ProofColors
    const tc = (settings?.colors?.textContrast?.proof ?? {}) as ProofContrast
    const bg = pc[key] || '#e5e7eb'
    const b = (tc[key] ?? true)
    const fg = b ? '#000' : '#fff'
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>{`#${label}`}</span>
  }

  function ProofColumn({ title, bucket, children }: { title: string; bucket: ProofBucket; children: React.ReactNode }) {
    const key = titleToKey(title)
    type ProofColors = Partial<Record<ProofKey, string>>
    const pc = (settings?.colors?.proof ?? {}) as ProofColors
    const bg = pc[key] || '#ffffff'
    const bgSoft = withAlpha(bg, 0.3)
    const isActive = dropTarget?.bucket === bucket
    return (
      <div
        className={`border rounded-lg p-3 xl:h-full xl:min-h-0 flex flex-col text-black ${isActive ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-300'}`}
        style={{ backgroundColor: bgSoft }}
        onDragOver={(e) => { e.preventDefault(); onContainerDragOver(bucket) }}
        onDragEnter={() => onContainerDragOver(bucket)}
        onDrop={(e) => { e.preventDefault(); handleDrop(bucket) }}
      >
        <div className="mb-2">{proofChip(title)}</div>
        <div
          className="flex-1 space-y-2 overflow-auto pr-1"
          onDragOver={(e) => { e.preventDefault(); try { ((e as unknown as DragEvent).dataTransfer as DataTransfer).dropEffect = 'move' } catch {}; onContainerDragOver(bucket) }}
          onDragEnter={() => onContainerDragOver(bucket)}
          onDrop={(e) => { e.preventDefault(); handleDrop(bucket) }}
        >
          {children}
        </div>
      </div>
    )
  }

  function CardItem({ card, index, bucket }: { card: Card; index: number; bucket: ProofBucket }) {
    const [editing, setEditing] = useState(false)
    const [text, setText] = useState(card.text)
    useEffect(() => setText(card.text), [card.text])
    return (
      <div
        className="border border-gray-300 rounded-md p-3 bg-white text-black select-none cursor-move"
        draggable={!editing}
        onDragStart={(e) => {
          if (editing) return
          try { e.dataTransfer.setData('application/x-cardmass', JSON.stringify({ id: card.id, from: bucket, index })) } catch {}
          try { e.dataTransfer.setData('text/plain', card.id) } catch {}
          e.dataTransfer.effectAllowed = 'move'
          setDragging({ id: card.id, from: bucket })
          const el = e.currentTarget as HTMLElement
          el.classList.add('opacity-70', 'shadow')
        }}
        onDragEnd={(e) => {
          setDragging(null)
          const el = e.currentTarget as HTMLElement
          el.classList.remove('opacity-70', 'shadow')
        }}
        onDragOver={(e) => {
          e.preventDefault()
          try { (e as unknown as DragEvent).dataTransfer!.dropEffect = 'move' } catch {}
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          const after = (e.clientY - rect.top) > rect.height / 2
          const targetIndex = index + (after ? 1 : 0)
          setDropTarget({ bucket, index: targetIndex })
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
                await updateCard(card.id, { text: t })
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
          <div className="flex items-center gap-2 flex-wrap" />
          <div className="flex items-center gap-2">
            <button onClick={async () => { await archiveCard(card.id) }} className="text-gray-700 hover:underline">archive</button>
            <button onClick={() => setEditing(v => !v)} className="text-blue-600 hover:underline">{editing ? 'cancel' : 'edit'}</button>
            <button onClick={() => deleteCard(card.id)} className="text-red-600 hover:underline">delete</button>
          </div>
        </div>
      </div>
    )
  }

  // Layout: xl → diamond grid (3 | 1 | 3). Below xl → stacked columns.
  return (
    <main className="p-4 bg-white text-black flex flex-col xl:h-screen xl:overflow-hidden">
      <div className="flex-1 xl:overflow-hidden">
        {/* XL diamond */}
        <div className="hidden xl:grid gap-4 h-full min-h-0" style={{ gridTemplateRows: '1fr 1.2fr 1fr' }}>
          {/* Top row: Persona | Proposal | Outcome */}
          <div className="grid grid-cols-3 gap-4 min-h-0">
            <ProofColumn title="Persona" bucket="Persona">
              {persona.map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket="Persona" />))}
            </ProofColumn>
            <ProofColumn title="Proposal" bucket="Proposal">
              {proposal.map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket="Proposal" />))}
            </ProofColumn>
            <ProofColumn title="Outcome" bucket="Outcome">
              {outcome.map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket="Outcome" />))}
            </ProofColumn>
          </div>
          {/* Middle row: Benefit | decide | Decline */}
          <div className="grid grid-cols-3 gap-4 min-h-0">
            <ProofColumn title="Benefit" bucket="Benefit">
              {benefit.map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket="Benefit" />))}
            </ProofColumn>
            <ProofColumn title="decide" bucket={'decide' as ProofBucket}>
              {decide.map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket={'decide' as ProofBucket} />))}
            </ProofColumn>
            <ProofColumn title="Decline" bucket={'decline' as ProofBucket}>
              {decline.map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket={'decline' as ProofBucket} />))}
            </ProofColumn>
          </div>
          {/* Bottom row: Journey | Validation | Cost */}
          <div className="grid grid-cols-3 gap-4 min-h-0">
            <ProofColumn title="Journey" bucket="Journey">
              {journey.map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket="Journey" />))}
            </ProofColumn>
            <ProofColumn title="Validation" bucket="Validation">
              {validation.map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket="Validation" />))}
            </ProofColumn>
            <ProofColumn title="Cost" bucket="Cost">
              {cost.map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket="Cost" />))}
            </ProofColumn>
          </div>
        </div>
          {/* Below xl: stacked */}
          <div className="xl:hidden space-y-4">
            {([
              ['Persona', persona] as const,
              ['Proposal', proposal] as const,
              ['Outcome', outcome] as const,
              ['Benefit', benefit] as const,
              ['decide', decide] as const,
              ['Decline', decline] as const,
              ['Journey', journey] as const,
              ['Validation', validation] as const,
              ['Cost', cost] as const,
            ]).map(([name, list]) => (
            <ProofColumn key={name} title={name} bucket={name as ProofBucket}>
              {(list as Card[]).map((c, idx) => (<CardItem key={c.id} card={c} index={idx} bucket={name as ProofBucket} />))}
            </ProofColumn>
            ))}
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
        showToggle={false}
        showArchive={true}
        showKanban={true}
        showMatrix={true}
        showBusiness={true}
        showAdmin={true}
        onAdminNav={() => router.push('/admin')}
      />
    </main>
  )
}
