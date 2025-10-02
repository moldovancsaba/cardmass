import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isUUIDv4 } from '@/lib/validation'
// TODO Phase 4: Server-side auth enforcement
// import { enforceAdminOrPagePassword } from '@/lib/auth'
import type { Board } from '@/lib/types'

interface BoardDoc extends Board {
  _id?: import('mongodb').ObjectId
  uuid: string
  organizationId: string
}

function toBoard(doc: BoardDoc) {
  return {
    uuid: doc.uuid,
    organizationId: doc.organizationId,
    slug: doc.slug,
    rows: doc.rows,
    cols: doc.cols,
    areas: doc.areas,
    background: doc.background,
    version: doc.version,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt as string),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : (doc.updatedAt as string),
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ orgUUID: string, boardUUID: string }> }) {
  const { orgUUID, boardUUID } = await ctx.params
  if (!isUUIDv4(orgUUID) || !isUUIDv4(boardUUID)) return NextResponse.json({ error: { code: 'INVALID_ID', message: 'Invalid UUID parameter' } }, { status: 400 })
  
  // TODO Phase 4: Server-side zero-trust enforcement
  // Phase 1-3: UI-level protection only (PasswordGate component)
  // const url = new URL(req.url)
  // const hasPageHeaders = req.headers.get('x-page-id') || req.headers.get('x-page-type') || req.headers.get('x-page-password')
  // const scopeParam = url.searchParams.get('scope')
  // if (hasPageHeaders || scopeParam === 'tagger') {
  //   const access = await enforceAdminOrPagePassword({ pageId: boardUUID, pageType: 'tagger' })
  //   if (!access.allowed) {
  //     return NextResponse.json(
  //       { error: { code: 'UNAUTHORIZED', message: access.reason || 'Access denied' } },
  //       { status: access.status || 401 }
  //     )
  //   }
  // }
  
  try {
    const db = await getDb()
    const doc = await db.collection<BoardDoc>('boards').findOne({ organizationId: orgUUID, uuid: boardUUID })
    if (!doc) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Board not found' } }, { status: 404 })
    return NextResponse.json(toBoard(doc))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ orgUUID: string, boardUUID: string }> }) {
  const { orgUUID, boardUUID } = await ctx.params
  if (!isUUIDv4(orgUUID) || !isUUIDv4(boardUUID)) return NextResponse.json({ error: { code: 'INVALID_ID', message: 'Invalid UUID parameter' } }, { status: 400 })

  let body: Partial<Pick<BoardDoc, 'slug' | 'rows' | 'cols' | 'areas' | 'background'>> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: { code: 'BAD_JSON', message: 'Invalid JSON' } }, { status: 400 }) }

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof body.slug === 'string') patch.slug = body.slug.trim()
  if (Number.isFinite(body.rows)) patch.rows = Number(body.rows)
  if (Number.isFinite(body.cols)) patch.cols = Number(body.cols)
  if (Array.isArray(body.areas)) patch.areas = body.areas
  if (typeof body.background === 'string') patch.background = String(body.background)

  try {
    const db = await getDb()
    const col = db.collection<BoardDoc>('boards')
    const doc = await col.findOne({ organizationId: orgUUID, uuid: boardUUID })
    if (!doc) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Board not found' } }, { status: 404 })
    const newVersion = (doc.version || 0) + 1
    await col.updateOne({ _id: doc._id }, { $set: { ...patch, version: newVersion } })
    const updated = await col.findOne({ _id: doc._id })
    return NextResponse.json(toBoard(updated as BoardDoc))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ orgUUID: string, boardUUID: string }> }) {
  const { orgUUID, boardUUID } = await ctx.params
  if (!isUUIDv4(orgUUID) || !isUUIDv4(boardUUID)) return NextResponse.json({ error: { code: 'INVALID_ID', message: 'Invalid UUID parameter' } }, { status: 400 })
  try {
    const db = await getDb()
    const res = await db.collection<BoardDoc>('boards').deleteOne({ organizationId: orgUUID, uuid: boardUUID })
    return NextResponse.json({ ok: true, deleted: res.deletedCount || 0 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}