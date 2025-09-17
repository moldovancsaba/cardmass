"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/types/card'
import { fetchJSON } from '@/lib/client'
import { daysBetweenUtc } from '@/lib/date'
import { interpolateColor, withAlpha } from '@/lib/color'
import { useSettings } from '@/lib/settings'
import BottomBar from '@/components/BottomBar'

export default function Board({ initialView = 'kanban', axisHidden = false, titleOverrides = {} as Partial<Record<'do' | 'decide' | 'delegate' | 'decline', string>>, createDefaultStatus = 'decide' }: { initialView?: 'kanban' | 'matrix', axisHidden?: boolean, titleOverrides?: Partial<Record<'do' | 'decide' | 'delegate' | 'decline', string>>, createDefaultStatus?: Card['status'] }) {
  const router = useRouter()
  const [roadmap, setRoadmap] = useState<Card[]>([])
  const [backlog, setBacklog] = useState<Card[]>([])
  const [todo, setTodo] = useState<Card[]>([])
  const [decline, setDecline] = useState<Card[]>([])
  const [view] = useState<'kanban' | 'matrix'>(initialView)
  const settings = useSettings()

  const getTitle = useCallback((s: 'do'|'decide'|'delegate'|'decline') => {
    const t = titleOverrides?.[s]
    return t || `#${s}`
  }, [titleOverrides])

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
      body: JSON.stringify({ text, status: createDefaultStatus }),
    })
    setBacklog((prev) => insertSorted([created, ...prev]))
  }, [insertSorted, createDefaultStatus])

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
        <div className="grid grid-cols-1 xl:grid-cols-2 xl:grid-rows-2 xl:h-full xl:min-h-0 gap-4 relative items-stretch">
          <Rect
            title={getTitle('do')}
            status="do"
            isActive={dropTarget?.status === 'do'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
            axisHidden={axisHidden}
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
                extraChips={[`#${(c as unknown as { business?: 'ValuePropositions'|'KeyActivities'|'KeyResources' }).business || 'ValuePropositions'}`, '#urgent', '#important']}
              />
            ))}
          </Rect>
          <Rect
            title={getTitle('decide')}
            status="decide"
            isActive={dropTarget?.status === 'decide'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
            axisHidden={axisHidden}
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
                extraChips={[`#${(c as unknown as { business?: Card['business'] }).business || 'ValuePropositions'}`, '#urgent', '#not-important']}
              />
            ))}
          </Rect>
          <Rect
            title={getTitle('delegate')}
            status="delegate"
            isActive={dropTarget?.status === 'delegate'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
            axisHidden={axisHidden}
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
                onDragFlag={() => setDragging({ id: c.id, from: 'delegate' })}
                extraChips={[`#${(c as unknown as { business?: 'ValuePropositions'|'KeyActivities'|'KeyResources' }).business || 'ValuePropositions'}`, '#not-urgent', '#important']}
              />
            ))}
          </Rect>
          <Rect
            title={getTitle('decline')}
            status="decline"
            isActive={dropTarget?.status === 'decline'}
            onContainerDragOver={onContainerDragOver}
            onContainerDrop={handleDrop}
            axisHidden={axisHidden}
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
                onDragFlag={() => setDragging({ id: c.id, from: 'decline' })}
                extraChips={[`#${(c as unknown as { business?: 'ValuePropositions'|'KeyActivities'|'KeyResources' }).business || 'ValuePropositions'}`, '#not-urgent', '#not-important']}
              />
            ))}
          </Rect>
          {!axisHidden && (
            <>
              <div className="hidden md:block absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                {(() => {
                  const bg = settings?.colors?.matrixAxis?.important || '#93c5fd'
                  const b = settings?.colors?.textContrast?.matrixAxis?.important ?? true
                  const fg = b ? '#000' : '#fff'
                  return (
                    <div className="-rotate-90 origin-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>#important</span>
                    </div>
                  )
                })()}
              </div>
              <div className="hidden md:block absolute left-1/2 top-3/4 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                {(() => {
                  const bg = settings?.colors?.matrixAxis?.not_important || '#bfdbfe'
                  const b = settings?.colors?.textContrast?.matrixAxis?.not_important ?? true
                  const fg = b ? '#000' : '#fff'
                  return (
                    <div className="-rotate-90 origin-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>#not-important</span>
                    </div>
                  )
                })()}
              </div>
              <div className="hidden md:block absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                {(() => {
                  const bg = settings?.colors?.matrixAxis?.urgent || '#fca5a5'
                  const b = settings?.colors?.textContrast?.matrixAxis?.urgent ?? true
                  const fg = b ? '#000' : '#fff'
                  return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>#urgent</span>
                  )
                })()}
              </div>
              <div className="hidden md:block absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                {(() => {
                  const bg = settings?.colors?.matrixAxis?.not_urgent || '#fecaca'
                  const b = settings?.colors?.textContrast?.matrixAxis?.not_urgent ?? true
                  const fg = b ? '#000' : '#fff'
                  return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>#not-urgent</span>
                  )
                })()}
              </div>
            </>
          )}
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
        onProofNav={() => router.push('/proof')}
        onAdminNav={() => router.push('/admin')}
        showKanban={false}
        showMatrix={false}
        showBusiness={true}
        showProof={true}
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
  const settings = useSettings()
  return (
    <div
className={`flex flex-col xl:h-full xl:min-h-0 md:min-h-0 border rounded-lg p-3 text-black ${isActive ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-300'}`}
      style={{ backgroundColor: (() => {
        const s = String(status)
        if (s.startsWith('bmc:')) {
          const key = s.slice(4)
          const bb = settings?.colors?.businessBadges as Record<string, string> | undefined
          const col = (bb?.[key]) || '#ffffff'
          return withAlpha(col, 0.3)
        }
        const sc = settings?.colors?.status as Record<string, string> | undefined
        const col = sc?.[status] || '#ffffff'
        return withAlpha(col, 0.3)
      })() }}
      onDragOver={(e) => { e.preventDefault(); try { ((e as unknown as DragEvent).dataTransfer as DataTransfer).dropEffect = 'move' } catch {}; onContainerDragOver(status) }}
      onDragEnter={() => onContainerDragOver(status)}
      onDrop={(e) => { e.preventDefault(); onContainerDrop(status) }}
    >
      <div className="mb-2">
        {(() => {
          // Render column title as a colored chip based on status/business bucket
          let bg = '#e5e7eb'
          let fg = '#000'
          const s = status as string
          const txt = settings?.colors?.textContrast
          if (s.startsWith('bmc:')) {
            const key = s.slice(4)
            const bb = settings?.colors?.businessBadges as Record<string, string> | undefined
            const bbTxt = txt?.businessBadges as Record<string, boolean> | undefined
            bg = (bb?.[key]) || bg
            const b = bbTxt?.[key]
            fg = (b ?? true) ? '#000' : '#fff'
          } else {
            const sk = s as 'delegate'|'decide'|'do'|'decline'
            const sc = settings?.colors?.status as Record<string, string> | undefined
            const stTxt = txt?.status as Record<string, boolean> | undefined
            bg = (sc?.[sk]) || bg
            const b = stTxt?.[sk]
            fg = (b ?? true) ? '#000' : '#fff'
          }
          return (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>{title}</span>
          )
        })()}
      </div>
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


function Rect({ title, status, isActive, onContainerDragOver, onContainerDrop, children, axisHidden = false }: {
  title: string
  status: 'delegate' | 'decide' | 'do' | 'decline'
  isActive: boolean
  onContainerDragOver: (s: 'delegate'|'decide'|'do'|'decline') => void
  onContainerDrop: (s: 'delegate'|'decide'|'do'|'decline') => void
  children: React.ReactNode
  axisHidden?: boolean
}) {
  const settings = useSettings()
  return (
    <div
className={`border rounded-lg p-3 xl:h-full xl:min-h-0 md:min-h-0 flex flex-col text-black ${isActive ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-300'} relative`}
      style={{ backgroundColor: (() => {
        const sc = settings?.colors?.status as Record<string, string> | undefined
        const col = sc?.[status] || '#ffffff'
        // 30% transparency
        return withAlpha(col, 0.3)
      })() }}
      onDragOver={(e) => { e.preventDefault(); onContainerDragOver(status) }}
      onDragEnter={() => onContainerDragOver(status)}
      onDrop={(e) => { e.preventDefault(); onContainerDrop(status) }}
    >
      {(() => {
        // Inside-rect vertical axis chips for left column: top = #important, bottom = #not-important
        if (!axisHidden && (status === 'do' || status === 'delegate')) {
          const axisKey = status === 'do' ? 'important' : 'not_important'
          const label = status === 'do' ? '#important' : '#not-important'
          const bg = (settings?.colors?.matrixAxis as Record<string,string> | undefined)?.[axisKey] || (axisKey === 'important' ? '#93c5fd' : '#bfdbfe')
          const b = (settings?.colors?.textContrast?.matrixAxis as Record<string, boolean> | undefined)?.[axisKey] ?? true
          const fg = b ? '#000' : '#fff'
          return (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-0">
              <div className="-rotate-90 origin-left -translate-x-1/2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>{label}</span>
              </div>
            </div>
          )
        }
        return null
      })()}
      <div className="mb-2 flex flex-col gap-1 items-start">
        <div className="flex items-center gap-2">
          {(() => {
            // Render quadrant title as a colored chip based on status
            let bg = '#e5e7eb'
            let fg = '#000'
            const s = status as string
            const txt = settings?.colors?.textContrast
            const sc = settings?.colors?.status as Record<string, string> | undefined
            const stTxt = txt?.status as Record<string, boolean> | undefined
            bg = (sc?.[s]) || bg
            const b = stTxt?.[s]
            fg = (b ?? true) ? '#000' : '#fff'
            return (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>{title}</span>
            )
          })()}
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-auto pr-1">
        {children}
      </div>
    </div>
  )
}

export function CardItem({ card, index, status, onUpdate, onDelete, onArchive, bubbleContext, onHoverIndex, onDragFlag, hideBadges = false, extraChips }: {
  card: Card
  index: number
  status: Card['status']
  onUpdate: (id: string, data: Partial<Pick<Card, 'text' | 'status' | 'order'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onArchive: (id: string) => Promise<void>
  bubbleContext: { kind: Card['status']; minAge: number; maxAge: number; minRot: number; maxRot: number }
  onHoverIndex: (t: { status: Card['status'], index: number | null }) => void
  onDragFlag: (d: { id: string; from: Card['status'] } | null) => void
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
          {Array.isArray(extraChips) && extraChips.map((chip, i) => {
            // Decide chip background by type: status, axis, or business bucket; and apply text color from textContrast.
            const chipRaw = chip.replace('#','')
            const sKey = chipRaw.toLowerCase()
            const statusColors: Record<string, string> = (settings?.colors?.status ?? {}) as Record<string, string>
            const bizMap: Record<string, string> = (settings?.colors?.businessBadges ?? {}) as Record<string, string>
            const axisMap: Record<string, string> = (settings?.colors?.matrixAxis ?? {}) as Record<string, string>
            const txt = settings?.colors?.textContrast
            let bg = '#e5e7eb'
            let fg = '#000'
            if (sKey === 'delegate' || sKey === 'decide' || sKey === 'do' || sKey === 'decline') {
              bg = statusColors[sKey] || bg
              const b = txt?.status?.[sKey as keyof NonNullable<typeof txt>['status']] ?? true
              fg = b ? '#000' : '#fff'
            } else if (sKey === 'urgent' || sKey === 'not-urgent' || sKey === 'important' || sKey === 'not-important') {
              const axisKey = sKey.replace('-', '_')
              bg = axisMap[axisKey] || bg
              const b = txt?.matrixAxis?.[axisKey as keyof NonNullable<typeof txt>['matrixAxis']] ?? true
              fg = b ? '#000' : '#fff'
            } else {
              // Convert PascalCase/CamelCase to snake_case
              const snake = chipRaw
                .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
                .replace(/\s+/g, '_')
                .toLowerCase()
              const mapped = snake === 'cost' ? 'cost_structure' : (snake === 'revenue_stream' ? 'revenue_streams' : snake)
              bg = bizMap[mapped] || bg
              const b = txt?.businessBadges?.[mapped as keyof NonNullable<typeof txt>['businessBadges']] ?? true
              fg = b ? '#000' : '#fff'
            }
            return (
              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: bg, color: fg }}>{chip}</span>
            )
          })}
          {!hideBadges && (
            <>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: ageColor, color: (settings?.colors?.textContrast?.ranges?.age ?? true) ? '#000' : '#fff' }}>
                #Created {daysOld} days ago
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: rotColor, color: (settings?.colors?.textContrast?.ranges?.rotten ?? true) ? '#000' : '#fff' }}>
                #rotten for {rottenDays} days
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
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
              try {
                // Create or reuse a public share snapshot and open it
                const res = await fetch(`/api/public/shares`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cardId: card.id }) })
                if (!res.ok) return
                const { uuid } = await res.json() as { uuid?: string }
                if (!uuid) return
                const url = `${window.location.origin}/card/${uuid}`
                window.location.href = url
              } catch {}
            }}
            className="text-gray-700 hover:underline"
            aria-label="Open public link"
          >
            open
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
