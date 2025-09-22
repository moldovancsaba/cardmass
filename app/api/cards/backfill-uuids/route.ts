import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongoose'
import { Card } from '@/models/Card'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

// POST /api/cards/backfill-uuids
// Backfills UUIDs for all cards missing them. Returns the number updated.
export async function POST() {
  await connectToDatabase()
  const q = { $or: [ { uuid: { $exists: false } }, { uuid: null }, { uuid: '' } ] }
  const cursor = Card.find(q).cursor()
  let updated = 0
  for await (const doc of cursor) {
    try {
      doc.uuid = randomUUID()
      await doc.save()
      updated++
    } catch {}
  }
  return NextResponse.json({ ok: true, updated })
}
