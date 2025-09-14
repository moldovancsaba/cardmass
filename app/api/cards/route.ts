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
export type Status = typeof allowedStatuses[number]

// GET /api/cards?status=delegate|decide|do|decline&business=ValuePropositions|KeyActivities|KeyResources&archived=true|false
export async function GET(req: Request) {
  await connectToDatabase()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const business = url.searchParams.get('business')
  const archivedParam = url.searchParams.get('archived')
  const filter: Record<string, unknown> = {}
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
      'bmc:key_partners': ['bmc:key_partners'],
      'bmc:key_activities': ['bmc:key_activities'],
      'bmc:key_resources': ['bmc:key_resources'],
      'bmc:value_propositions': ['bmc:value_propositions'],
      'bmc:customer_relationships': ['bmc:customer_relationships'],
      'bmc:channels': ['bmc:channels'],
      'bmc:customer_segments': ['bmc:customer_segments'],
      'bmc:cost_structure': ['bmc:cost_structure'],
      'bmc:revenue_streams': ['bmc:revenue_streams'],
    }
    filter.status = { $in: synonyms[status as Status] }
  }
  if (business) {
    if (!['KeyPartners','KeyActivities','KeyResources','ValuePropositions','CustomerRelationships','Channels','CustomerSegments','Cost','RevenueStream'].includes(business)) {
      return NextResponse.json({ error: 'Invalid business' }, { status: 400 })
    }
    if (business === 'ValuePropositions') {
      // Treat missing business as ValuePropositions for backward compatibility
      filter.$or = [
        { business: 'ValuePropositions' },
        { business: { $exists: false } },
      ]
    } else {
      filter.business = business
    }
  }
  // Default: exclude archived unless explicitly requested
  if (archivedParam === 'true' || archivedParam === '1') {
    filter.archived = true
  } else if (archivedParam === 'false' || archivedParam === '0' || archivedParam === null) {
    filter.archived = { $ne: true }
  }
  // Sort by dimension: if business filtered, use businessOrder; else use order
  const sortTuples: [string, 1 | -1][] = business ? [['businessOrder', 1], ['updatedAt', -1]] : [['order', 1], ['updatedAt', -1]]
  const docs = await Card.find(filter).sort(sortTuples)
  // Auto-backfill UUIDs for any documents missing one. This runs server-side in every environment,
  // ensuring global convergence without requiring manual migrations in each environment.
  type CardDocLike = { uuid?: string; save: () => Promise<unknown> }
  const missing = (docs as unknown as CardDocLike[]).filter((d) => !d.uuid)
  if (missing.length) {
    await Promise.all(missing.map(async (d) => { (d as CardDocLike).uuid = randomUUID(); await d.save() }))
  }
  const payload = docs.map((d) => d.toJSON())
  return NextResponse.json(payload)
}

// POST /api/cards
// Body: { text: string, status?: 'delegate'|'decide'|'do'|'decline' }
export async function POST(req: Request) {
  await connectToDatabase()
  let body: unknown
  try { body = await req.json() } catch { body = {} }
  const b = (body ?? {}) as { text?: string; status?: string; business?: 'KeyPartners'|'KeyActivities'|'KeyResources'|'ValuePropositions'|'CustomerRelationships'|'Channels'|'CustomerSegments'|'Cost'|'RevenueStream' }
  const text = (b.text ?? '').trim()
  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }
  let status: Status = 'decide'
  if (typeof b.status === 'string' && (allowedStatuses as readonly string[]).includes(b.status)) {
    status = b.status as Status
  }
  const business: 'KeyPartners'|'KeyActivities'|'KeyResources'|'ValuePropositions'|'CustomerRelationships'|'Channels'|'CustomerSegments'|'Cost'|'RevenueStream' =
    (b.business === 'KeyPartners' || b.business === 'KeyActivities' || b.business === 'KeyResources' || b.business === 'ValuePropositions' || b.business === 'CustomerRelationships' || b.business === 'Channels' || b.business === 'CustomerSegments' || b.business === 'Cost' || b.business === 'RevenueStream') ? b.business : 'ValuePropositions'
  // Insert new cards at the top of the chosen status and business columns by assigning an order less than the current minimum.
  const top = await Card.findOne({ status, archived: { $ne: true } }).sort({ order: 1 })
  const order = top && typeof top.order === 'number' ? top.order - 1 : 0
  const topBiz = await Card.findOne({ business, archived: { $ne: true } }).sort({ businessOrder: 1 })
  const topBizOrder = (topBiz && (topBiz as unknown as { businessOrder?: number }).businessOrder)
  const businessOrder = typeof topBizOrder === 'number' ? (topBizOrder as number) - 1 : 0
  const created = await Card.create({ text, status, order, business, businessOrder })
  // toJSON mapping ensures ISO timestamps and id
  return NextResponse.json(created.toJSON(), { status: 201 })
}
