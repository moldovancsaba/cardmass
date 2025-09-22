import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongoose'
import { Card } from '@/models/Card'

export const runtime = 'nodejs'

// GET /api/cards/by-uuid/[uuid]
export async function GET(_req: Request, context: unknown) {
  await connectToDatabase()
  const { params } = (context ?? {}) as { params?: { uuid?: string } }
  const uuid = params?.uuid
  if (!uuid || typeof uuid !== 'string') {
    return NextResponse.json({ error: 'Missing uuid' }, { status: 400 })
  }
  // Return even if archived, to ensure public links remain resolvable.
  const doc = await Card.findOne({ uuid })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(doc.toJSON())
}
