import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isUUIDv4 } from '@/lib/validation'
// TODO Phase 4: Server-side auth enforcement
// import { enforceAdminOrPagePassword } from '@/lib/auth'
import type { CardDoc } from '@/lib/types'

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

export async function GET(_req: Request, ctx: { params: Promise<{ orgUUID: string, cardUUID: string }> }) {
  const { orgUUID, cardUUID } = await ctx.params
  if (!isUUIDv4(orgUUID) || !isUUIDv4(cardUUID)) return NextResponse.json({ error: { code: 'INVALID_ID', message: 'Invalid UUID parameter' } }, { status: 400 })
  try {
    const db = await getDb()
    const doc = await db.collection<OrgCardDoc>('cards').findOne({ organizationId: orgUUID, uuid: cardUUID })
    if (!doc) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Card not found' } }, { status: 404 })
    return NextResponse.json(toCard(doc))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ orgUUID: string, cardUUID: string }> }) {
  const { orgUUID, cardUUID } = await ctx.params
  if (!isUUIDv4(orgUUID) || !isUUIDv4(cardUUID)) return NextResponse.json({ error: { code: 'INVALID_ID', message: 'Invalid UUID parameter' } }, { status: 400 })

  // TODO Phase 4: Server-side zero-trust enforcement
  // Phase 1-3: UI-level protection only (PasswordGate component)
  // const hasPageHeaders = req.headers.get('x-page-id') || req.headers.get('x-page-type') || req.headers.get('x-page-password')
  // if (hasPageHeaders) {
  //   const pageId = req.headers.get('x-page-id')
  //   if (pageId && isUUIDv4(pageId)) {
  //     const access = await enforceAdminOrPagePassword({ pageId, pageType: 'tagger' })
  //     if (!access.allowed) {
  //       return NextResponse.json(
  //         { error: { code: 'UNAUTHORIZED', message: access.reason || 'Access denied' } },
  //         { status: access.status || 401 }
  //       )
  //     }
  //   }
  // }

  let body: Partial<Pick<OrgCardDoc, 'text' | 'status' | 'order' | 'areaLabel' | 'boardAreas' | 'isArchived'>> & { boardArea?: { boardSlug?: string; areaLabel?: string } } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: { code: 'BAD_JSON', message: 'Invalid JSON' } }, { status: 400 }) }

  const setPaths: Record<string, unknown> = { updatedAt: new Date() }
  const unsetPaths: Record<string, ''> = {}

  if (typeof body.text === 'string') setPaths['text'] = body.text.trim()
  if (typeof body.status === 'string') setPaths['status'] = body.status
  if (typeof body.order === 'number') setPaths['order'] = body.order
  if (typeof body.areaLabel === 'string') setPaths['areaLabel'] = body.areaLabel
  if (typeof body.isArchived === 'boolean') setPaths['isArchived'] = body.isArchived
  if (body.boardArea && typeof body.boardArea.boardSlug === 'string') {
    const slug = (body.boardArea.boardSlug || '').trim()
    const label = (body.boardArea.areaLabel || '')
    if (slug) {
      if (label === '') {
        unsetPaths[`boardAreas.${slug}`] = ''
      } else {
        setPaths[`boardAreas.${slug}`] = label
      }
    }
  }

  try {
    const db = await getDb()
    const col = db.collection<OrgCardDoc>('cards')
    const doc = await col.findOne({ organizationId: orgUUID, uuid: cardUUID })
    if (!doc) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Card not found' } }, { status: 404 })

    // Preflight: if boardAreas exists but is not an object, normalize it to avoid dotted-path update errors.
    if (body.boardArea && typeof body.boardArea.boardSlug === 'string') {
      const ba = (doc as OrgCardDoc).boardAreas as unknown
      const isObj = ba && typeof ba === 'object' && !Array.isArray(ba)
      if (!isObj) {
        await col.updateOne({ _id: doc._id }, { $unset: { boardAreas: '' }, $set: { updatedAt: new Date() } })
      }
    }

    const updatePayload: Record<string, unknown> = { $set: setPaths }
    if (Object.keys(unsetPaths).length) updatePayload['$unset'] = unsetPaths
    await col.updateOne({ _id: doc._id }, updatePayload)

    const updated = await col.findOne({ _id: doc._id })
    return NextResponse.json(toCard(updated as OrgCardDoc))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ orgUUID: string, cardUUID: string }> }) {
  const { orgUUID, cardUUID } = await ctx.params
  if (!isUUIDv4(orgUUID) || !isUUIDv4(cardUUID)) return NextResponse.json({ error: { code: 'INVALID_ID', message: 'Invalid UUID parameter' } }, { status: 400 })
  
  // TODO Phase 4: Server-side zero-trust enforcement
  // Phase 1-3: UI-level protection only (PasswordGate component)
  // const hasPageHeaders = req.headers.get('x-page-id') || req.headers.get('x-page-type') || req.headers.get('x-page-password')
  // if (hasPageHeaders) {
  //   const pageId = req.headers.get('x-page-id')
  //   if (pageId && isUUIDv4(pageId)) {
  //     const access = await enforceAdminOrPagePassword({ pageId, pageType: 'tagger' })
  //     if (!access.allowed) {
  //       return NextResponse.json(
  //         { error: { code: 'UNAUTHORIZED', message: access.reason || 'Access denied' } },
  //         { status: access.status || 401 }
  //       )
  //     }
  //   }
  // }
  
  try {
    const db = await getDb()
    const res = await db.collection<OrgCardDoc>('cards').deleteOne({ organizationId: orgUUID, uuid: cardUUID })
    return NextResponse.json({ ok: true, deleted: res.deletedCount || 0 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}
