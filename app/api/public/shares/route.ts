import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongoose'
import { Card } from '@/models/Card'
import { Share } from '@/models/Share'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

// POST /api/public/shares
// Body: { cardId: string }
// Creates or reuses a Share snapshot for a card and returns { uuid }
export async function POST(req: Request) {
  await connectToDatabase()
  let body: unknown
  try { body = await req.json() } catch { body = {} }
  const { cardId } = (body ?? {}) as { cardId?: string }
  if (!cardId) return NextResponse.json({ error: 'Missing cardId' }, { status: 400 })
  const card = await Card.findById(cardId)
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Try to find existing share linked to this card
  let share = await Share.findOne({ cardId })
  if (!share) {
    share = await Share.create({
      uuid: randomUUID(),
      cardId,
      text: card.text,
      status: card.status,
      business: (card as unknown as { business?: string }).business,
    })
  } else {
    // Update snapshot text/status on reuse
    share.text = card.text
    share.status = card.status
    ;(share as unknown as { business?: string }).business = (card as unknown as { business?: string }).business
    await share.save()
  }
  return NextResponse.json({ uuid: share.uuid })
}
