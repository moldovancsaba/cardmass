"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/types/card'
import { fetchJSON } from '@/lib/client'
import { daysBetweenUtc, hoursBetweenUtc } from '@/lib/date'

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Column title="#roadmap">
        {roadmap.map((c) => (
          <CardItem key={c.id} card={c} onUpdate={updateCard} onDelete={deleteCard} />
        ))}
      </Column>
      <Column title="#backlog" composer onCreate={createCard}>
        {backlog.map((c) => (
          <CardItem key={c.id} card={c} onUpdate={updateCard} onDelete={deleteCard} />
        ))}
      </Column>
      <Column title="#todo">
        {todo.map((c) => (
          <CardItem key={c.id} card={c} onUpdate={updateCard} onDelete={deleteCard} />
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

function CardItem({ card, onUpdate, onDelete }: {
  card: Card
  onUpdate: (id: string, data: Partial<Pick<Card, 'text' | 'status'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(card.text)

  useEffect(() => setText(card.text), [card.text])

  const daysOld = useMemo(() => daysBetweenUtc(card.createdAt), [card.createdAt])
  const hoursOld = useMemo(() => hoursBetweenUtc(card.createdAt), [card.createdAt])
  const rottenDays = useMemo(() => daysBetweenUtc(card.updatedAt), [card.updatedAt])
  const rottenHours = useMemo(() => hoursBetweenUtc(card.updatedAt), [card.updatedAt])

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
        <div>
          <span>{daysOld} days ({hoursOld} hours) old</span>
          <span className="mx-2">•</span>
          <span>rotten for {rottenDays} days ({rottenHours} hours)</span>
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
