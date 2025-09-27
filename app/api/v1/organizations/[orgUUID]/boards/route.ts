import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isUUIDv4 } from '@/lib/validation'
import type { Board } from '@/lib/types'

interface BoardDoc extends Board {
  _id?: import('mongodb').ObjectId
  uuid: string
  organizationId: string
  // Board already includes: slug, rows, cols, areas, version, createdAt, updatedAt
}

function toBoard(doc: BoardDoc) {
  return {
    uuid: doc.uuid,
    organizationId: doc.organizationId,
    slug: doc.slug,
    rows: doc.rows,
    cols: doc.cols,
    areas: doc.areas,
    version: doc.version,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt as string),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : (doc.updatedAt as string),
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ orgUUID: string }> }) {
  const { orgUUID } = await ctx.params
  if (!isUUIDv4(orgUUID)) return NextResponse.json({ error: { code: 'INVALID_ORG_ID', message: 'Invalid organization UUID' } }, { status: 400 })
  try {
    const db = await getDb()
    const docs = await db.collection<BoardDoc>('boards').find({ organizationId: orgUUID }).sort({ updatedAt: -1 }).toArray()
    return NextResponse.json(docs.map(toBoard))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ orgUUID: string }> }) {
  const { orgUUID } = await ctx.params
  if (!isUUIDv4(orgUUID)) return NextResponse.json({ error: { code: 'INVALID_ORG_ID', message: 'Invalid organization UUID' } }, { status: 400 })

  let body: Partial<Pick<BoardDoc, 'slug' | 'rows' | 'cols' | 'areas'>> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: { code: 'BAD_JSON', message: 'Invalid JSON' } }, { status: 400 }) }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '' // metadata only
  const rows = Number.isFinite(body.rows) ? Number(body.rows) : 1
  const cols = Number.isFinite(body.cols) ? Number(body.cols) : 1
  const areas = Array.isArray(body.areas) ? (body.areas as Board['areas']) : []

  try {
    const db = await getDb()
    const col = db.collection<BoardDoc>('boards')
    const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } }
    const uuid = g.crypto?.randomUUID ? g.crypto.randomUUID() :
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
    const now = new Date()
    const doc: BoardDoc = {
      uuid,
      organizationId: orgUUID,
      slug,
      rows,
      cols,
      areas,
      version: 1,
      createdAt: now,
      updatedAt: now,
    }
    await col.insertOne(doc)
    return NextResponse.json(toBoard(doc), { status: 201 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}