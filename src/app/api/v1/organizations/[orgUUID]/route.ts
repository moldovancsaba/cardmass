import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isUUIDv4 } from '@/lib/validation'
import { ORG_HEADER } from '@/lib/http/headers'

interface OrganizationDoc {
  _id?: import('mongodb').ObjectId
  uuid: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function toOrg(o: OrganizationDoc) {
  return {
    uuid: o.uuid,
    name: o.name,
    slug: o.slug,
    description: o.description || '',
    isActive: !!o.isActive,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ orgUUID: string }> }) {
  const { orgUUID } = await ctx.params
  if (!isUUIDv4(orgUUID)) return NextResponse.json({ error: { code: 'INVALID_ORG_ID', message: 'Invalid organization UUID' } }, { status: 400 })
  try {
    const db = await getDb()
    const doc = await db.collection<OrganizationDoc>('organizations').findOne({ uuid: orgUUID })
    if (!doc) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } }, { status: 404 })
    return NextResponse.json(toOrg(doc))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ orgUUID: string }> }) {
  const { orgUUID } = await ctx.params
  if (!isUUIDv4(orgUUID)) return NextResponse.json({ error: { code: 'INVALID_ORG_ID', message: 'Invalid organization UUID' } }, { status: 400 })

  // Enforce org scope via header
  const hdr = req.headers.get(ORG_HEADER) || ''
  if (hdr !== orgUUID) return NextResponse.json({ error: { code: 'ORG_SCOPE_MISMATCH', message: `Missing or mismatched ${ORG_HEADER}` } }, { status: 400 })

  let body: Partial<Pick<OrganizationDoc, 'name' | 'slug' | 'description' | 'isActive'>> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: { code: 'BAD_JSON', message: 'Invalid JSON' } }, { status: 400 }) }

  const patch: Partial<OrganizationDoc> = {}
  if (typeof body.name === 'string') patch.name = body.name.trim()
  if (typeof body.slug === 'string') patch.slug = body.slug.trim()
  if (typeof body.description === 'string') patch.description = body.description
  if (typeof body.isActive === 'boolean') patch.isActive = body.isActive
  patch.updatedAt = new Date().toISOString() // ISO 8601 with ms, UTC

  try {
    const db = await getDb()
    const col = db.collection<OrganizationDoc>('organizations')
    const existing = await col.findOne({ uuid: orgUUID })
    if (!existing) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } }, { status: 404 })
    await col.updateOne({ _id: existing._id }, { $set: patch })
    const updated = await col.findOne({ _id: existing._id })
    return NextResponse.json(toOrg(updated as OrganizationDoc))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ orgUUID: string }> }) {
  const { orgUUID } = await ctx.params
  if (!isUUIDv4(orgUUID)) return NextResponse.json({ error: { code: 'INVALID_ORG_ID', message: 'Invalid organization UUID' } }, { status: 400 })

  // Enforce org scope via header
  const hdr = req.headers.get(ORG_HEADER) || ''
  if (hdr !== orgUUID) return NextResponse.json({ error: { code: 'ORG_SCOPE_MISMATCH', message: `Missing or mismatched ${ORG_HEADER}` } }, { status: 400 })

  try {
    const db = await getDb()
    const orgCol = db.collection<OrganizationDoc>('organizations')
    const boardsCol = db.collection('boards')
    const cardsCol = db.collection('cards')

    const orgRes = await orgCol.deleteOne({ uuid: orgUUID })
    const boardsRes = await boardsCol.deleteMany({ organizationId: orgUUID })
    const cardsRes = await cardsCol.deleteMany({ organizationId: orgUUID })

    return NextResponse.json({ ok: true, deleted: { organizations: orgRes.deletedCount || 0, boards: boardsRes.deletedCount || 0, cards: cardsRes.deletedCount || 0 } })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}
