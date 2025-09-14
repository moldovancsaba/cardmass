"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/types/card'
import { fetchJSON } from '@/lib/client'
import { daysBetweenUtc } from '@/lib/date'
import { interpolateColor } from '@/lib/color'
import { useSettings } from '@/lib/settings'
import BottomBar from '@/components/BottomBar'

export default function Board({ initialView = 'kanban' }: { initialView?: 'kanban' | 'matrix' }) {
  const router = useRouter()
  const [roadmap, setRoadmap] = useState<Card[]>([])
  const [backlog, setBacklog] = useState<Card[]>([])
  const [todo, setTodo] = useState<Card[]>([])
  const [decline, setDecline] = useState<Card[]>([])
  const [view] = useState<'kanban' | 'matrix'>(initialView)

  type Status = Card['status']

  // Track current drag source and target for native HTML5 DnD.
  const [dragging, setDragging] = useState<{ id: string; from: Status } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ status: Status; index: number | null } | null>(null)

  const load = useCallback(async () => {
    const [r, b, t, d] = await Promise.all([
      fetchJSON<Card[]>(`/api/cards?status=delegate`),
      fetchJSON<Card[]>(`/api/cards?status=decide`),
      fetchJSON<Card[]>(`/api/cards?status=do`),
      fetchJSON<Card[]>(`/api/cards?status=decline`),
    ])
    setRoadmap(r)
    setBacklog(b)
    setTodo(t)
    setDecline(d)
  }, [])

  useEffect(() => {
    load()
  }, [load])


  const deleteCard = useCallback(async (id: string) => {
    await fetchJSON<{ ok: boolean }>(`/api/cards/${id}`, { method: 'DELETE' })
    setRoadmap((prev) => prev.filter((c) => c.id !== id))
    setBacklog((prev) => prev.filter((c) => c.id !== id))
    setTodo((prev) => prev.filter((c) => c.id !== id))
    setDecline((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const archiveCard = useCallback(async (id: string) => {
    await fetchJSON(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) })
    setRoadmap((prev) => prev.filter((c) => c.id !== id))
    setBacklog((prev) => prev.filter((c) => c.id !== id))
    setTodo((prev) => prev.filter((c) => c.id !== id))
    setDecline((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // For bubble gradients, compute min/max ages and rottenness per container
  const stats = useMemo(() => {
    const containers = { roadmap, backlog, todo, decline } as const
    const result: Record<string, { minAge: number; maxAge: number; minRot: number; maxRot: number }> = {}
    for (const [name, arr] of Object.entries(containers)) {
      if (!arr.length) { result[name] = { minAge: 0, maxAge: 0, minRot: 0, maxRot: 0 }; continue }
      const ages = arr.map((c) => Date.now() - new Date(c.createdAt).getTime())
      const rots = arr.map((c) => Date.now() - new Date(c.updatedAt).getTime())
      result[name] = {
        minAge: Math.min(...ages),
        maxAge: Math.max(...ages),
        minRot: Math.min(...rots),
        maxRot: Math.max(...rots),
      }
    }
    return result
  }, [roadmap, backlog, todo, decline])

  // Helper: stable sort by order asc, then updatedAt desc for consistent UI.
  const byOrder = useCallback((a: Card, b: Card) => {
    const ao = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER
    const bo = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  }, [])

  // Helper: insert and return a new sorted array
  const insertSorted = useCallback((arr: Card[]) => {
    const next = [...arr]
    next.sort(byOrder)
    return next
  }, [byOrder])

  // Compute order by neighbor averaging around dropIndex in given list
  const computeOrder = useCallback((list: Card[], dropIndex: number) => {
    const prev = list[dropIndex - 1] || null
    const next = list[dropIndex] || null
    if (prev && next && prev.order < next.order) return (prev.order + next.order) / 2
    if (!prev && next) return next.order - 1
    if (prev && !next) return prev.order + 1
    return 0
  }, [])

  // CRUD helpers now that sorting helpers exist
  const createCard = useCallback(async (text: string) => {
    const created = await fetchJSON<Card>(`/api/cards`, {
      method: 'POST',
      body: JSON.stringify({ text, status: 'decide' }),
    })
    setBacklog((prev) => insertSorted([created, ...prev]))
  }, [insertSorted])

  const updateCard = useCallback(async (id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => {
    const updated = await fetchJSON<Card>(`/api/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    // Move between columns if status changed
    setRoadmap((prev) => prev.filter((c) => c.id !== id))
    setBacklog((prev) => prev.filter((c) => c.id !== id))
    setTodo((prev) => prev.filter((c) => c.id !== id))
    setDecline((prev) => prev.filter((c) => c.id !== id))
    if (updated.status === 'delegate') setRoadmap((prev) => insertSorted([...prev, updated]))
    if (updated.status === 'decide') setBacklog((prev) => insertSorted([...prev, updated]))
    if (updated.status === 'do') setTodo((prev) => insertSorted([...prev, updated]))
    if (updated.status === 'decline') setDecline((prev) => insertSorted([...prev, updated]))
  }, [insertSorted])

  // Map status to current list
  const getList = useCallback((s: Status) => {
    if (s === 'delegate') return roadmap
    if (s === 'decide') return backlog
    if (s === 'do') return todo
    return decline
  }, [roadmap, backlog, todo, decline])

  // Handle a drop on a container; uses dropTarget.index as insertion point
  const handleDrop = useCallback(async (targetStatus: Status) => {
    const drag = dragging
    const target = dropTarget
    setDropTarget(null)
    setDragging(null)
    if (!drag) return
    const id = drag.id
    const from = drag.from
    const currentList = getList(targetStatus)
    // Default to end
    let dropIndex = typeof target?.index === 'number' && target.status === targetStatus ? target.index : currentList.length
    // Exclude the dragged card if moving within the same list to compute correct index
    const filtered = currentList.filter((c) => c.id !== id)
    if (dropIndex > filtered.length) dropIndex = filtered.length
    const newOrder = computeOrder(filtered, Math.max(0, Math.min(filtered.length, dropIndex)))
    await updateCard(id, from === targetStatus ? { order: newOrder } : { status: targetStatus, order: newOrder })
  }, [dragging, dropTarget, getList, computeOrder, updateCard])

  // Container drag-over updates active target while preserving insertion index when hovering items within same container
  const onContainerDragOver = useCallback((status: Status) => {
    setDropTarget((prev) => ({ status, index: prev?.status === status ? (prev.index ?? null) : null }))
  }, [])

  return (
    <div className="relative flex flex-col xl:h-full">
      <div className="flex-1 xl:overflow-hidden xl:min-h-0">
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:h-full md:min-h-0 relative">
          <Column
            title="#delegate"
            status="delegate"
            isActive={dropTarget?.status === 'delegate'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
          >
            {roadmap.map((c, idx) => (
          <CardItem
            key={c.id}
            index={idx}
            status={'delegate'}
            card={c}
            onUpdate={updateCard}
            onDelete={deleteCard}
            onArchive={archiveCard}
            onHoverIndex={setDropTarget}
            bubbleContext={{ kind: 'delegate', ...stats.roadmap }}
            onDragFlag={setDragging}
extraChips={[`#${(c as unknown as { business?: Card['business'] }).business || 'ValuePropositions'}`]}
          />
            ))}
          </Column>
          <Column
            title="#decide"
            status="decide"
            isActive={dropTarget?.status === 'decide'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
          >
            {backlog.map((c, idx) => (
          <CardItem
            key={c.id}
            index={idx}
            status={'decide'}
            card={c}
            onUpdate={updateCard}
            onDelete={deleteCard}
            onArchive={archiveCard}
            onHoverIndex={setDropTarget}
            bubbleContext={{ kind: 'decide', ...stats.backlog }}
            onDragFlag={setDragging}
extraChips={[`#${(c as unknown as { business?: Card['business'] }).business || 'ValuePropositions'}`]}
          />
            ))}
          </Column>
          <Column
            title="#do"
            status="do"
            isActive={dropTarget?.status === 'do'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
          >
            {todo.map((c, idx) => (
          <CardItem
            key={c.id}
            index={idx}
            status={'do'}
            card={c}
            onUpdate={updateCard}
            onDelete={deleteCard}
            onArchive={archiveCard}
            onHoverIndex={setDropTarget}
            bubbleContext={{ kind: 'do', ...stats.todo }}
            onDragFlag={setDragging}
extraChips={[`#${(c as unknown as { business?: Card['business'] }).business || 'ValuePropositions'}`]}
          />
            ))}
          </Column>
        </div>
      ) : (
        <div className="xl:pl-16 xl:pt-8 grid grid-cols-1 xl:grid-cols-2 xl:grid-rows-2 xl:h-full xl:min-h-0 gap-4 relative items-stretch">
          <Rect
            title="#do"
            status="do"
            isActive={dropTarget?.status === 'do'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
          >
            {todo.map((c, idx) => (
              <CardItem
                key={c.id}
                index={idx}
                status={'do'}
                card={c}
                onUpdate={updateCard}
                onDelete={deleteCard}
                onArchive={archiveCard}
                onHoverIndex={setDropTarget}
                bubbleContext={{ kind: 'do', ...stats.todo }}
                onDragFlag={setDragging}
extraChips={[`#${(c as unknown as { business?: 'ValuePropositions'|'KeyActivities'|'KeyResources' }).business || 'ValuePropositions'}`]}
              />
            ))}
          </Rect>
          <Rect
            title="#decide"
            status="decide"
            isActive={dropTarget?.status === 'decide'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
          >
            {backlog.map((c, idx) => (
              <CardItem
                key={c.id}
                index={idx}
                status={'decide'}
                card={c}
                onUpdate={updateCard}
                onDelete={deleteCard}
                onArchive={archiveCard}
                onHoverIndex={setDropTarget}
                bubbleContext={{ kind: 'decide', ...stats.backlog }}
                onDragFlag={setDragging}
extraChips={[`#${(c as unknown as { business?: Card['business'] }).business || 'ValuePropositions'}`]}
              />
            ))}
          </Rect>
          <Rect
            title="#delegate"
            status="delegate"
            isActive={dropTarget?.status === 'delegate'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
          >
            {roadmap.map((c, idx) => (
              <CardItem
                key={c.id}
                index={idx}
                status={'delegate'}
                card={c}
                onUpdate={updateCard}
                onDelete={deleteCard}
                onArchive={archiveCard}
                onHoverIndex={setDropTarget}
                bubbleContext={{ kind: 'delegate', ...stats.roadmap }}
                onDragFlag={setDragging}
                extraChips={[`#${(c as unknown as { business?: 'ValuePropositions'|'KeyActivities'|'KeyResources' }).business || 'ValuePropositions'}`]}
              />
            ))}
          </Rect>
          <Rect
            title="#decline"
            status="decline"
            isActive={dropTarget?.status === 'decline'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
          >
            {decline.map((c, idx) => (
              <CardItem
                key={c.id}
                index={idx}
                status={'decline'}
                card={c}
                onUpdate={updateCard}
                onDelete={deleteCard}
                onArchive={archiveCard}
                onHoverIndex={setDropTarget}
                bubbleContext={{ kind: 'decline', ...stats.decline }}
                onDragFlag={setDragging}
                extraChips={[`#${(c as unknown as { business?: 'ValuePropositions'|'KeyActivities'|'KeyResources' }).business || 'ValuePropositions'}`]}
              />
            ))}
          </Rect>
          {/* Axis labels */}
          <div className="hidden md:block absolute left-2 top-1/4 -translate-y-1/2 z-10 pointer-events-none">
            <div className="-rotate-90 origin-left text-sm font-mono text-black">Important</div>
          </div>
          <div className="hidden md:block absolute left-2 top-3/4 -translate-y-1/2 z-10 pointer-events-none">
            <div className="-rotate-90 origin-left text-sm font-mono text-black">Not Important</div>
          </div>
          <div className="hidden md:block absolute left-1/4 top-2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="text-sm font-mono text-black">Urgent</div>
          </div>
          <div className="hidden md:block absolute left-3/4 top-2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="text-sm font-mono text-black">Not-Urgent</div>
          </div>
        </div>
      )}
      </div>

      {/* Bottom sticky composer and layout toggle */}
      <BottomBar
        view={view}
        onCreate={createCard}
        onToggle={() => router.push(view === 'kanban' ? '/matrix' : '/kanban')}
        onArchiveNav={() => router.push('/archive')}
        onKanbanNav={() => router.push('/kanban')}
        onMatrixNav={() => router.push('/matrix')}
        onBusinessNav={() => router.push('/business')}
        onAdminNav={() => router.push('/admin')}
        showKanban={false}
        showMatrix={false}
        showBusiness={true}
        showArchive={true}
        showAdmin={true}
        showToggle={true}
      />
    </div>
  )
}

export function Column({ title, status, isActive, onContainerDragOver, onContainerDrop, children }: {
  title: string
  status: 'delegate' | 'decide' | 'do' | 'decline' | 'bmc:key_partners' | 'bmc:key_activities' | 'bmc:key_resources' | 'bmc:value_propositions' | 'bmc:customer_relationships' | 'bmc:channels' | 'bmc:customer_segments' | 'bmc:cost_structure' | 'bmc:revenue_streams'
  isActive: boolean
  onContainerDragOver: (s: Card['status']) => void
  onContainerDrop: (s: Card['status']) => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex flex-col xl:h-full xl:min-h-0 md:min-h-0 border rounded-lg p-3 text-black bg-white ${isActive ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-300'}`}
      onDragOver={(e) => { e.preventDefault(); try { ((e as unknown as DragEvent).dataTransfer as DataTransfer).dropEffect = 'move' } catch {}; onContainerDragOver(status) }}
      onDragEnter={() => onContainerDragOver(status)}
      onDrop={(e) => { e.preventDefault(); onContainerDrop(status) }}
    >
      <div className="text-sm font-mono text-black mb-2">{title}</div>
      <div
        className="flex-1 space-y-2 overflow-auto pr-1"
        onDragOver={(e) => { e.preventDefault(); try { ((e as unknown as DragEvent).dataTransfer as DataTransfer).dropEffect = 'move' } catch {}; onContainerDragOver(status) }}
        onDragEnter={() => onContainerDragOver(status)}
        onDrop={(e) => { e.preventDefault(); onContainerDrop(status) }}
      >
        {children}
      </div>
    </div>
  )
}


function Rect({ title, status, isActive, onContainerDragOver, onContainerDrop, children }: {
  title: string
  status: 'delegate' | 'decide' | 'do' | 'decline'
  isActive: boolean
  onContainerDragOver: (s: 'delegate'|'decide'|'do'|'decline') => void
  onContainerDrop: (s: 'delegate'|'decide'|'do'|'decline') => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`border rounded-lg p-3 xl:h-full xl:min-h-0 md:min-h-0 flex flex-col text-black bg-white ${isActive ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-300'}`}
      onDragOver={(e) => { e.preventDefault(); onContainerDragOver(status) }}
      onDragEnter={() => onContainerDragOver(status)}
      onDrop={(e) => { e.preventDefault(); onContainerDrop(status) }}
    >
      <div className="text-sm font-mono text-black mb-2">{title}</div>
      <div className="flex-1 space-y-2 overflow-auto pr-1">
        {children}
      </div>
    </div>
  )
}

export function CardItem({ card, index, status, onUpdate, onDelete, onArchive, bubbleContext, onHoverIndex, onDragFlag, statusOptions, hideBadges = false, extraChips }: {
  card: Card
  index: number
  status: Card['status']
  onUpdate: (id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onArchive: (id: string) => Promise<void>
  bubbleContext: { kind: Card['status']; minAge: number; maxAge: number; minRot: number; maxRot: number }
  onHoverIndex: (t: { status: Card['status'], index: number | null }) => void
  onDragFlag: (d: { id: string; from: Card['status'] } | null) => void
  statusOptions?: Array<{ value: Card['status']; label: string }>
  hideBadges?: boolean
  extraChips?: string[]
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(card.text)

  useEffect(() => setText(card.text), [card.text])

  const daysOld = useMemo(() => daysBetweenUtc(card.createdAt), [card.createdAt])
  const rottenDays = useMemo(() => daysBetweenUtc(card.updatedAt), [card.updatedAt])

  // Compute normalized positions for coloring
  const ageMs = useMemo(() => Date.now() - new Date(card.createdAt).getTime(), [card.createdAt])
  const rotMs = useMemo(() => Date.now() - new Date(card.updatedAt).getTime(), [card.updatedAt])
  const ageT = useMemo(() => {
    const span = bubbleContext.maxAge - bubbleContext.minAge
    if (span <= 0) return 1 // if all equal, treat as newest (lighter blue)
    return (ageMs - bubbleContext.minAge) / span
  }, [ageMs, bubbleContext.maxAge, bubbleContext.minAge])
  const rotT = useMemo(() => {
    const span = bubbleContext.maxRot - bubbleContext.minRot
    if (span <= 0) return 0 // if all equal, treat as least rotten (green)
    return (rotMs - bubbleContext.minRot) / span
  }, [rotMs, bubbleContext.maxRot, bubbleContext.minRot])

  const settings = useSettings()
  const ageStart = settings?.colors?.age?.oldest || '#0a3d91'
  const ageEnd = settings?.colors?.age?.newest || '#9ecbff'
  const rotStart = settings?.colors?.rotten?.least || '#2ecc71'
  const rotEnd = settings?.colors?.rotten?.most || '#8e5b3a'
  // Colors: oldest (dark blue) -> newest (light blue)
  const ageColor = useMemo(() => interpolateColor(ageStart, ageEnd, ageT), [ageStart, ageEnd, ageT])
  // Rotten: least (green) -> most (brown)
  const rotColor = useMemo(() => interpolateColor(rotStart, rotEnd, rotT), [rotStart, rotEnd, rotT])

  const defaultStatusOptions: Array<{ value: Card['status']; label: string }> = [
    { value: 'delegate', label: 'delegate' },
    { value: 'decide', label: 'decide' },
    { value: 'do', label: 'do' },
    { value: 'decline', label: 'decline' },
  ]
  const options = statusOptions ?? defaultStatusOptions

  return (
    <div
      className={`border border-gray-300 rounded-md p-3 bg-white text-black select-none cursor-move`}
      draggable={!editing}
      onDragStart={(e) => {
        if (editing) return
        try {
          e.dataTransfer.setData('application/x-cardmass', JSON.stringify({ id: card.id, fromStatus: status, fromIndex: index }))
        } catch {}
        try {
          e.dataTransfer.setData('text/plain', card.id)
        } catch {}
        e.dataTransfer.effectAllowed = 'move'
        onDragFlag({ id: card.id, from: status })
        const el = e.currentTarget as HTMLElement
        el.classList.add('opacity-70', 'shadow')
      }}
      onDragEnd={(e) => {
        onDragFlag(null)
        const el = e.currentTarget as HTMLElement
        el.classList.remove('opacity-70', 'shadow')
      }}
      onDragOver={(e) => {
        // Compute insertion index before/after this item based on cursor position
        e.preventDefault()
        try { e.dataTransfer.dropEffect = 'move' } catch {}
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
        <div className="flex items-center gap-2 flex-wrap">
          {Array.isArray(extraChips) && extraChips.map((chip, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-200 text-gray-800">{chip}</span>
          ))}
          {!hideBadges && (
            <>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: ageColor }}>
                #Created {daysOld} days ago
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: rotColor }}>
                #rotten for {rottenDays} days
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={card.status}
            onChange={async (e) => {
              await onUpdate(card.id, { status: e.target.value as Card['status'] })
            }}
            className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white text-black"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={async () => { await onArchive(card.id) }}
            className="text-gray-700 hover:underline"
            aria-label="Archive card"
          >
            archive
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-blue-600 hover:underline"
            aria-label="Edit text"
          >
            {editing ? 'cancel' : 'edit'}
          </button>
          <button
            onClick={async () => {
              if (!('uuid' in card) || !card.uuid) {
                // No UUID present (should be rare after migration). Provide feedback safely.
                try { alert('Share link unavailable yet for this card.'); } catch {}
                return
              }
              try {
                const url = `${window.location.origin}/card/${card.uuid}`
                await navigator.clipboard.writeText(url)
              } catch {}
            }}
            className="text-gray-700 hover:underline"
            aria-label="Copy share link"
          >
            link
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="text-red-600 hover:underline"
            aria-label="Delete card"
          >
            delete
          </button>
        </div>
      </div>
    </div>
  )
}
