import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongoose'
import { Card } from '@/models/Card'
import type { Status } from '@/app/api/cards/route'

export const runtime = 'nodejs'

const allowedStatuses = ['delegate', 'decide', 'do', 'decline'] as const

// PATCH /api/cards/[id]
// DELETE /api/cards/[id]
export async function PATCH(req: Request, context: unknown) {
  await connectToDatabase()
  let bodyUnknown: unknown
  try { bodyUnknown = await req.json() } catch { bodyUnknown = {} }
  const body = (bodyUnknown ?? {}) as { text?: string; status?: string; order?: number; archived?: boolean }

  const update: Partial<{ text: string; status: Status; order: number; archived: boolean; archivedAt: Date | null }> = {}
  if (typeof body.text === 'string') {
    const t = body.text.trim()
    if (!t) return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 })
    update.text = t
  }
  let needsTopPlacement = false
  if (typeof body.status === 'string') {
    if (!(allowedStatuses as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    update.status = body.status as Status
    if (typeof body.order !== 'number') {
      needsTopPlacement = true
    }
  }
  if (typeof body.order === 'number' && Number.isFinite(body.order)) {
    update.order = body.order
  }
  // Archiving sets archived=true and archivedAt now
  if (typeof body.archived === 'boolean') {
    if (body.archived === true) {
      update.archived = true
      update.archivedAt = new Date()
    } else {
      update.archived = false
      update.archivedAt = null
    }
  }
  const { params } = (context ?? {}) as { params?: { id?: string } }
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // If status changed without explicit order, place at the top of the target status (non-archived).
  if (needsTopPlacement && update.status) {
    const top = await Card.findOne({ status: update.status, archived: { $ne: true } }).sort({ order: 1 })
    update.order = top && typeof top.order === 'number' ? top.order - 1 : 0
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const updated = await Card.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated.toJSON())
}

export async function DELETE(_req: Request, context: unknown) {
  await connectToDatabase()
  const { params } = (context ?? {}) as { params?: { id?: string } }
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const res = await Card.findByIdAndDelete(id)
  if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
