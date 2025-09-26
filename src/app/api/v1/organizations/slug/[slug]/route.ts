import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

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

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  if (!slug) return NextResponse.json({ error: { code: 'SLUG_REQUIRED', message: 'Missing slug' } }, { status: 400 })
  try {
    const db = await getDb()
    const doc = await db.collection<OrganizationDoc>('organizations').findOne({ slug })
    if (!doc) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } }, { status: 404 })
    return NextResponse.json(toOrg(doc))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}