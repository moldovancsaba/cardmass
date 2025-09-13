import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongoose'
import { Card } from '@/models/Card'

export const runtime = 'nodejs'

const allowedStatuses = ['delegate', 'decide', 'do', 'decline'] as const
export type Status = typeof allowedStatuses[number]

// GET /api/cards?status=delegate|decide|do|decline&archived=true|false
export async function GET(req: Request) {
  await connectToDatabase()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const archivedParam = url.searchParams.get('archived')
  const filter: { status?: Status | { $in: string[] }; archived?: boolean | { $ne: boolean } } = {}
  if (status) {
    if (!(allowedStatuses as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    // Backward-compatibility: include legacy statuses so existing cards still appear
    const synonyms: Record<Status, string[]> = {
      delegate: ['delegate', 'roadmap'],
      decide: ['decide', 'backlog'],
      do: ['do', 'todo'],
      decline: ['decline'],
    }
    filter.status = { $in: synonyms[status as Status] }
  }
  // Default: exclude archived unless explicitly requested
  if (archivedParam === 'true' || archivedParam === '1') {
    filter.archived = true
  } else if (archivedParam === 'false' || archivedParam === '0' || archivedParam === null) {
    filter.archived = { $ne: true }
  }
  // Sort by UI order (ascending) with updatedAt desc as a secondary key
  const docs = await Card.find(filter).sort({ order: 1, updatedAt: -1 })
  const payload = docs.map((d) => d.toJSON())
  return NextResponse.json(payload)
}

// POST /api/cards
// Body: { text: string, status?: 'delegate'|'decide'|'do'|'decline' }
export async function POST(req: Request) {
  await connectToDatabase()
  let body: unknown
  try { body = await req.json() } catch { body = {} }
  const b = (body ?? {}) as { text?: string; status?: string }
  const text = (b.text ?? '').trim()
  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }
  let status: Status = 'decide'
  if (typeof b.status === 'string' && (allowedStatuses as readonly string[]).includes(b.status)) {
    status = b.status as Status
  }
  // Insert new cards at the top of the chosen status by assigning an order less than the current minimum.
  const top = await Card.findOne({ status, archived: { $ne: true } }).sort({ order: 1 })
  const order = top && typeof top.order === 'number' ? top.order - 1 : 0
  const created = await Card.create({ text, status, order })
  // toJSON mapping ensures ISO timestamps and id
  return NextResponse.json(created.toJSON(), { status: 201 })
}
