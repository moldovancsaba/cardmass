import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'
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
    boardAreas: doc.boardAreas || undefined,
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  // Extend payload to support per-board placement updates.
  let body: Partial<Pick<CardDoc, 'text' | 'status' | 'order' | 'areaLabel'>> & { boardArea?: { boardSlug?: string; areaLabel?: string } } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // Use dotted path updates to avoid overwriting the whole boardAreas object inadvertently.
  const setPaths: Record<string, unknown> = { updatedAt: new Date() }
  const unsetPaths: Record<string, ''> = {}

  if (typeof body.text === 'string') setPaths['text'] = body.text.trim()
  if (body.status) setPaths['status'] = body.status as CardStatus
  if (typeof body.order === 'number') setPaths['order'] = body.order
  if (typeof body.areaLabel === 'string') setPaths['areaLabel'] = body.areaLabel

  // If a specific board placement is provided, update boardAreas.<slug> accordingly.
  if (body.boardArea && typeof body.boardArea.boardSlug === 'string') {
    const slug = (body.boardArea.boardSlug || '').trim()
    const label = (body.boardArea.areaLabel || '')
    if (slug) {
      if (label === '') {
        // Clear placement (spock fallback) — spock is not persisted
        unsetPaths[`boardAreas.${slug}`] = ''
      } else {
        // Set canonical placement label for this board (merge-safe)
        setPaths[`boardAreas.${slug}`] = label
      }
    }
  }

  try {
    const db = await getDb()
    const col = db.collection<CardDoc>('cards')
    const _id = new ObjectId(id)

    // Preflight: normalize boardAreas type if needed to avoid dotted path conflicts
    if (body.boardArea && typeof body.boardArea.boardSlug === 'string') {
      const existing = await col.findOne({ _id })
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const ba = (existing as CardDoc).boardAreas as unknown
      const isObj = ba && typeof ba === 'object' && !Array.isArray(ba)
      if (!isObj) {
        // If not an object, unset whole boardAreas first; this prevents path conflicts
        await col.updateOne({ _id }, { $unset: { boardAreas: '' }, $set: { updatedAt: new Date() } })
        // Then proceed with the main update which may be a clear or set depending on payload
      }
    }

    const updatePayload: Record<string, unknown> = { $set: setPaths }
    if (Object.keys(unsetPaths).length) updatePayload['$unset'] = unsetPaths
    await col.updateOne({ _id }, updatePayload)
    const doc = await col.findOne({ _id })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(toCard(doc))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    const db = await getDb()
    const col = db.collection<CardDoc>('cards')
    const _id = new ObjectId(id)
    const res = await col.deleteOne({ _id })
    return NextResponse.json({ ok: true, deleted: res.deletedCount })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}