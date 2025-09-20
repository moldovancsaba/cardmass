import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Card, CardDoc, CardStatus } from '@/lib/types'

function toCard(doc: CardDoc): Card {
  return {
    id: doc._id ? doc._id.toString() : '',
    text: doc.text,
    status: doc.status,
    order: doc.order,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    boardSlug: doc.boardSlug,
    areaLabel: doc.areaLabel,
    // Include per-board placements for N-dimensional classification
    boardAreas: doc.boardAreas || undefined,
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status') as CardStatus | null
  const board = url.searchParams.get('board') || undefined
  try {
    const db = await getDb()
    const col = db.collection<CardDoc>('cards')
    const filter: Partial<{ status: CardStatus; boardSlug: string }> = {}
    if (status) filter.status = status
    if (board) filter.boardSlug = board
    const docs = await col
      .find(filter)
      .sort({ order: 1, updatedAt: -1 })
      .toArray()
    return NextResponse.json(docs.map(toCard))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Accept legacy areaLabel but do not set 'spock' — spock is a virtual inbox and must not be persisted.
  let body: Partial<Pick<CardDoc, 'text' | 'status' | 'boardSlug' | 'areaLabel' | 'boardAreas'>> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const text = (body.text || '').trim()
  const status = (body.status || 'decide') as CardStatus
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  try {
    const db = await getDb()
    const col = db.collection<CardDoc>('cards')
    // Insert at top => min(order) - 1
    const minDoc = await col.find({ status }).sort({ order: 1 }).limit(1).toArray()
    const minOrder = minDoc.length ? minDoc[0].order : 0
    const now = new Date()
    // Never persist 'spock' in areaLabel; boardAreas is optional and defaults to empty
    const initialBoardAreas: Record<string, string> | undefined = (body.boardAreas && typeof body.boardAreas === 'object') ? body.boardAreas as Record<string, string> : undefined
    const safeAreaLabel = (body.areaLabel && body.areaLabel.toLowerCase() === 'spock') ? '' : (body.areaLabel || undefined)
    const doc: CardDoc = { text, status, order: minOrder - 1, createdAt: now, updatedAt: now, boardSlug: body.boardSlug, areaLabel: safeAreaLabel, boardAreas: initialBoardAreas }
    const res = await col.insertOne(doc)
    doc._id = res.insertedId
    return NextResponse.json(toCard(doc))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
