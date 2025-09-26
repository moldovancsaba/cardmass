import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isoNow } from '@/lib/datetime'

// Types for organizations stored in MongoDB
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

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection<OrganizationDoc>('organizations').find({}).sort({ updatedAt: -1 }).toArray()
    return NextResponse.json(docs.map(toOrg))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}

export async function POST(req: Request) {
  let body: Partial<Pick<OrganizationDoc, 'name' | 'slug' | 'description'>> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: { code: 'BAD_JSON', message: 'Invalid JSON' } }, { status: 400 }) }

  const name = String(body.name || '').trim()
  const slug = String(body.slug || '').trim()
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  if (!name) return NextResponse.json({ error: { code: 'NAME_REQUIRED', message: 'name is required' } }, { status: 400 })
  if (!slug) return NextResponse.json({ error: { code: 'SLUG_REQUIRED', message: 'slug is required' } }, { status: 400 })
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: { code: 'SLUG_INVALID', message: 'slug must contain only lowercase letters, numbers, and hyphens' } }, { status: 400 })

  try {
    const db = await getDb()
    const col = db.collection<OrganizationDoc>('organizations')
    const existing = await col.findOne({ slug })
    if (existing) return NextResponse.json({ error: { code: 'SLUG_EXISTS', message: 'Organization slug already exists' } }, { status: 409 })

    // Prefer built-in crypto.randomUUID via dynamic import (available in runtime). Use small fallback if not available.
    const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } }
    const uuid = g.crypto?.randomUUID ? g.crypto.randomUUID() :
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })

    const now = isoNow()
    const doc: OrganizationDoc = { uuid, name, slug, description, isActive: true, createdAt: now, updatedAt: now }
    await col.insertOne(doc)
    return NextResponse.json(toOrg(doc), { status: 201 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}