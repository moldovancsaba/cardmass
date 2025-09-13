"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/types/card'
import { fetchJSON } from '@/lib/client'
import { daysBetweenUtc, hoursBetweenUtc } from '@/lib/date'
import { interpolateColor } from '@/lib/color'
import { useSettings } from '@/lib/settings'

export default function Board() {
  const [roadmap, setRoadmap] = useState<Card[]>([])
  const [backlog, setBacklog] = useState<Card[]>([])
  const [todo, setTodo] = useState<Card[]>([])

  const load = useCallback(async () => {
    const [r, b, t] = await Promise.all([
      fetchJSON<Card[]>(`/api/cards?status=roadmap`),
      fetchJSON<Card[]>(`/api/cards?status=backlog`),
      fetchJSON<Card[]>(`/api/cards?status=todo`),
    ])
    setRoadmap(r)
    setBacklog(b)
    setTodo(t)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const createCard = useCallback(async (text: string) => {
    const created = await fetchJSON<Card>(`/api/cards`, {
      method: 'POST',
      body: JSON.stringify({ text, status: 'backlog' }),
    })
    setBacklog((prev) => [created, ...prev])
  }, [])

  const updateCard = useCallback(async (id: string, data: Partial<Pick<Card, 'text' | 'status'>>) => {
    const updated = await fetchJSON<Card>(`/api/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    // Move between columns if status changed
    setRoadmap((prev) => prev.filter((c) => c.id !== id))
    setBacklog((prev) => prev.filter((c) => c.id !== id))
    setTodo((prev) => prev.filter((c) => c.id !== id))
    if (updated.status === 'roadmap') setRoadmap((prev) => [updated, ...prev])
    if (updated.status === 'backlog') setBacklog((prev) => [updated, ...prev])
    if (updated.status === 'todo') setTodo((prev) => [updated, ...prev])
  }, [])

  const deleteCard = useCallback(async (id: string) => {
    await fetchJSON<{ ok: boolean }>(`/api/cards/${id}`, { method: 'DELETE' })
    setRoadmap((prev) => prev.filter((c) => c.id !== id))
    setBacklog((prev) => prev.filter((c) => c.id !== id))
    setTodo((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // For bubble gradients, compute min/max ages and rottenness per column
  const stats = useMemo(() => {
    const columns = { roadmap, backlog, todo } as const
    const result: Record<string, { minAge: number; maxAge: number; minRot: number; maxRot: number }> = {}
    for (const [name, arr] of Object.entries(columns)) {
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
  }, [roadmap, backlog, todo])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Column title="#roadmap">
        {roadmap.map((c) => (
          <CardItem
            key={c.id}
            card={c}
            onUpdate={updateCard}
            onDelete={deleteCard}
            bubbleContext={{ kind: 'roadmap', ...stats.roadmap }}
          />
        ))}
      </Column>
      <Column title="#backlog" composer onCreate={createCard}>
        {backlog.map((c) => (
          <CardItem
            key={c.id}
            card={c}
            onUpdate={updateCard}
            onDelete={deleteCard}
            bubbleContext={{ kind: 'backlog', ...stats.backlog }}
          />
        ))}
      </Column>
      <Column title="#todo">
        {todo.map((c) => (
          <CardItem
            key={c.id}
            card={c}
            onUpdate={updateCard}
            onDelete={deleteCard}
            bubbleContext={{ kind: 'todo', ...stats.todo }}
          />
        ))}
      </Column>
    </div>
  )
}

function Column({ title, children, composer, onCreate }: {
  title: string
  children: React.ReactNode
  composer?: boolean
  onCreate?: (text: string) => Promise<void>
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] border border-gray-300 rounded-lg p-3 text-black bg-white">
      <div className="text-sm font-mono text-black mb-2">{title}</div>
      <div className="flex-1 space-y-2 overflow-auto pr-1">
        {children}
      </div>
      {composer && onCreate ? (
        <Composer onCreate={onCreate} />
      ) : null}
    </div>
  )
}

function Composer({ onCreate }: { onCreate: (text: string) => Promise<void> }) {
  const [value, setValue] = useState('')
  return (
    <div className="sticky bottom-0 mt-2 bg-white rounded-md border border-gray-300 p-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a card and press Enter"
        className="w-full resize-none outline-none bg-white text-black min-h-[48px]"
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            const text = value.trim()
            if (!text) return
            await onCreate(text)
            setValue('')
          }
        }}
      />
      <div className="text-[10px] text-gray-500 mt-1">Enter to create • Shift+Enter for newline</div>
    </div>
  )
}

function CardItem({ card, onUpdate, onDelete, bubbleContext }: {
  card: Card
  onUpdate: (id: string, data: Partial<Pick<Card, 'text' | 'status'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  bubbleContext: { kind: 'roadmap' | 'backlog' | 'todo'; minAge: number; maxAge: number; minRot: number; maxRot: number }
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(card.text)

  useEffect(() => setText(card.text), [card.text])

  const daysOld = useMemo(() => daysBetweenUtc(card.createdAt), [card.createdAt])
  const hoursOld = useMemo(() => hoursBetweenUtc(card.createdAt), [card.createdAt])
  const rottenDays = useMemo(() => daysBetweenUtc(card.updatedAt), [card.updatedAt])
  const rottenHours = useMemo(() => hoursBetweenUtc(card.updatedAt), [card.updatedAt])

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
    <div className="border border-gray-300 rounded-md p-3 bg-white text-black">
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
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-mono"
            style={{ backgroundColor: ageColor }}
          >
            #{daysOld} days ({hoursOld} hours) old
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-mono"
            style={{ backgroundColor: rotColor }}
          >
            #rotten for {rottenDays} days ({rottenHours} hours)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={card.status}
            onChange={async (e) => {
              await onUpdate(card.id, { status: e.target.value as Card['status'] })
            }}
            className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white text-black"
          >
            <option value="roadmap">roadmap</option>
            <option value="backlog">backlog</option>
            <option value="todo">todo</option>
          </select>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-blue-600 hover:underline"
            aria-label="Edit text"
          >
            {editing ? 'cancel' : 'edit'}
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
