import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongoose'
import { Card } from '@/models/Card'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

const allowedStatuses = [
  'delegate', 'decide', 'do', 'decline',
  'bmc:key_partners', 'bmc:key_activities', 'bmc:key_resources', 'bmc:value_propositions',
  'bmc:customer_relationships', 'bmc:channels', 'bmc:customer_segments',
  'bmc:cost_structure', 'bmc:revenue_streams'
] as const

// Local type derived from allowedStatuses to avoid cross-module type imports
// which can resolve to a different "app" tree when using the src/ directory.
type Status = (typeof allowedStatuses)[number]

// GET /api/cards/[id]
export async function GET(_req: Request, context: unknown) {
  await connectToDatabase()
  const { params } = (context ?? {}) as { params?: Promise<{ id?: string }> }
  const awaited = await params
  const id = awaited?.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const doc = await Card.findById(id)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Backfill uuid if missing
  if (!doc.uuid) {
    doc.uuid = randomUUID()
    await doc.save()
  }
  return NextResponse.json(doc.toJSON())
}

// PATCH /api/cards/[id]
// DELETE /api/cards/[id]
export async function PATCH(req: Request, context: unknown) {
  await connectToDatabase()
  let bodyUnknown: unknown
  try { bodyUnknown = await req.json() } catch { bodyUnknown = {} }
  const body = (bodyUnknown ?? {}) as { text?: string; status?: string; order?: number; archived?: boolean; business?: 'KeyPartners'|'KeyActivities'|'KeyResources'|'ValuePropositions'|'CustomerRelationships'|'Channels'|'CustomerSegments'|'Cost'|'RevenueStream'; businessOrder?: number }

  const update: Partial<{ text: string; status: Status; order: number; archived: boolean; archivedAt: Date | null; business: 'KeyPartners'|'KeyActivities'|'KeyResources'|'ValuePropositions'|'CustomerRelationships'|'Channels'|'CustomerSegments'|'Cost'|'RevenueStream'; businessOrder: number }> = {}
  if (typeof body.text === 'string') {
    const t = body.text.trim()
    if (!t) return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 })
    update.text = t
  }
  let needsTopPlacement = false
  let needsTopBizPlacement = false
  if (typeof body.status === 'string') {
    if (!(allowedStatuses as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    update.status = body.status as Status
    if (typeof body.order !== 'number') {
      needsTopPlacement = true
    }
  }
  if (typeof body.business === 'string') {
    if (!['KeyPartners','KeyActivities','KeyResources','ValuePropositions','CustomerRelationships','Channels','CustomerSegments','Cost','RevenueStream'].includes(body.business)) {
      return NextResponse.json({ error: 'Invalid business' }, { status: 400 })
    }
    update.business = body.business as 'KeyPartners'|'KeyActivities'|'KeyResources'|'ValuePropositions'|'CustomerRelationships'|'Channels'|'CustomerSegments'|'Cost'|'RevenueStream'
    if (typeof body.businessOrder !== 'number') {
      needsTopBizPlacement = true
    }
  }
  if (typeof body.order === 'number' && Number.isFinite(body.order)) {
    update.order = body.order
  }
  if (typeof body.businessOrder === 'number' && Number.isFinite(body.businessOrder)) {
    update.businessOrder = body.businessOrder
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
  const { params } = (context ?? {}) as { params?: Promise<{ id?: string }> }
  const awaited = await params
  const id = awaited?.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // If status changed without explicit order, place at the top of the target status (non-archived).
  if (needsTopPlacement && update.status) {
    const top = await Card.findOne({ status: update.status, archived: { $ne: true } }).sort({ order: 1 })
    update.order = top && typeof top.order === 'number' ? top.order - 1 : 0
  }
  // If business changed without explicit businessOrder, place at the top of the target business bucket.
  if (needsTopBizPlacement && update.business) {
    const topBiz = await Card.findOne({ business: update.business, archived: { $ne: true } }).sort({ businessOrder: 1 })
    const topBizOrder = (topBiz && (topBiz as unknown as { businessOrder?: number }).businessOrder)
    update.businessOrder = typeof topBizOrder === 'number' ? (topBizOrder as number) - 1 : 0
  }
  // If proof changed without explicit proofOrder, place at the top of the target proof bucket.
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const updated = await Card.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
  // Backfill uuid if missing on update as well
  if (updated && !updated.uuid) {
    updated.uuid = randomUUID()
    await updated.save()
  }
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated.toJSON())
}

export async function DELETE(_req: Request, context: unknown) {
  await connectToDatabase()
  const { params } = (context ?? {}) as { params?: Promise<{ id?: string }> }
  const awaited = await params
  const id = awaited?.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const res = await Card.findByIdAndDelete(id)
  if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
