import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongoose'
import { Card } from '@/models/Card'

export const runtime = 'nodejs'

const allowedStatuses = ['roadmap', 'backlog', 'todo'] as const
export type Status = typeof allowedStatuses[number]

// GET /api/cards?status=roadmap|backlog|todo
export async function GET(req: Request) {
  await connectToDatabase()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const filter: { status?: Status } = {}
  if (status) {
    if (!(allowedStatuses as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    filter.status = status as Status
  }
  const docs = await Card.find(filter).sort({ updatedAt: -1 })
  const payload = docs.map((d) => d.toJSON())
  return NextResponse.json(payload)
}

// POST /api/cards
// Body: { text: string, status?: 'roadmap'|'backlog'|'todo' }
export async function POST(req: Request) {
  await connectToDatabase()
  let body: unknown
  try { body = await req.json() } catch { body = {} }
  const b = (body ?? {}) as { text?: string; status?: string }
  const text = (b.text ?? '').trim()
  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }
  let status: Status = 'backlog'
  if (typeof b.status === 'string' && (allowedStatuses as readonly string[]).includes(b.status)) {
    status = b.status as Status
  }
  const created = await Card.create({ text, status })
  // toJSON mapping ensures ISO timestamps and id
  return NextResponse.json(created.toJSON(), { status: 201 })
}
