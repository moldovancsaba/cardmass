import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isUUIDv4 } from '@/lib/validation'
import type { CardDoc, CardStatus } from '@/lib/types'

interface OrgCardDoc extends CardDoc {
  uuid: string
  organizationId: string
}

function toCard(doc: OrgCardDoc) {
  return {
    id: doc._id ? doc._id.toString() : '',
    uuid: doc.uuid,
    organizationId: doc.organizationId,
    text: doc.text,
    status: doc.status,
    order: doc.order,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    boardSlug: doc.boardSlug,
    areaLabel: doc.areaLabel,
    boardAreas: doc.boardAreas || undefined,
    isArchived: !!doc.isArchived,
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ orgUUID: string }> }) {
  const { orgUUID } = await ctx.params
  if (!isUUIDv4(orgUUID)) return NextResponse.json({ error: { code: 'INVALID_ORG_ID', message: 'Invalid organization UUID' } }, { status: 400 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status') as CardStatus | null
  const archivedParam = url.searchParams.get('archived')
  // boardUUID is accepted for forward-compat; filtering by board UUID will be addressed in a later step

  try {
    const db = await getDb()
    const col = db.collection<OrgCardDoc>('cards')
    // Archived filtering policy:
    // - Default: exclude archived from list views
    // - archived=only: return only archived
    // - archived=include: include both archived and non-archived
    const filter: Record<string, unknown> = { organizationId: orgUUID }
    if (archivedParam === 'only') {
      filter.isArchived = true
    } else if (archivedParam === 'include') {
      // no filter on isArchived
    } else {
      filter.isArchived = { $ne: true }
    }
    if (status) filter.status = status
    const docs = await col.find(filter).sort({ order: 1, updatedAt: -1 }).toArray()
    return NextResponse.json(docs.map(toCard))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ orgUUID: string }> }) {
  const { orgUUID } = await ctx.params
  if (!isUUIDv4(orgUUID)) return NextResponse.json({ error: { code: 'INVALID_ORG_ID', message: 'Invalid organization UUID' } }, { status: 400 })

  let body: Partial<Pick<OrgCardDoc, 'text' | 'status' | 'boardSlug' | 'areaLabel' | 'boardAreas'>> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: { code: 'BAD_JSON', message: 'Invalid JSON' } }, { status: 400 }) }

  const text = String(body.text || '').trim()
  const status = (body.status || 'decide') as CardStatus
  if (!text) return NextResponse.json({ error: { code: 'TEXT_REQUIRED', message: 'text is required' } }, { status: 400 })

  try {
    const db = await getDb()
    const col = db.collection<OrgCardDoc>('cards')
    // Insert at top => min(order) - 1, per existing pattern
    const minDoc = await col.find({ organizationId: orgUUID, status }).sort({ order: 1 }).limit(1).toArray()
    const minOrder = minDoc.length ? (minDoc[0].order ?? 0) : 0
    const now = new Date()

    const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } }
    const uuid = g.crypto?.randomUUID ? g.crypto.randomUUID() :
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })

    const doc: OrgCardDoc = {
      uuid,
      organizationId: orgUUID,
      text,
      status,
      order: minOrder - 1,
      createdAt: now,
      updatedAt: now,
      boardSlug: body.boardSlug,
      areaLabel: (body.areaLabel && body.areaLabel.toLowerCase() === 'spock') ? '' : (body.areaLabel || undefined),
      boardAreas: (body.boardAreas && typeof body.boardAreas === 'object') ? (body.boardAreas as Record<string, string>) : undefined,
      isArchived: false,
    }
    const res = await col.insertOne(doc)
    doc._id = res.insertedId
    return NextResponse.json(toCard(doc), { status: 201 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}