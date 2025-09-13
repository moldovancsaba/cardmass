import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongoose'
import { Settings } from '@/models/Settings'

export const runtime = 'nodejs'

// GET returns the single global settings document (create with defaults if missing)
export async function GET() {
  await connectToDatabase()
  let doc = await Settings.findOne({ key: 'global' })
  if (!doc) {
    doc = await Settings.create({ key: 'global' })
  }
  return NextResponse.json(doc.toJSON())
}

// PATCH updates any subset of colors
export async function PATCH(req: Request) {
  await connectToDatabase()
  let body: unknown
  try { body = await req.json() } catch { body = {} }
  const b = (body ?? {}) as Partial<{
    colors: {
      age?: { oldest?: string; newest?: string }
      rotten?: { least?: string; most?: string }
    }
  }>

  const update: Record<string, string | object> = {}
  if (b.colors) update['colors'] = {}
  if (b.colors?.age) update['colors.age'] = {}
  if (typeof b.colors?.age?.oldest === 'string') update['colors.age.oldest'] = b.colors!.age!.oldest
  if (typeof b.colors?.age?.newest === 'string') update['colors.age.newest'] = b.colors!.age!.newest
  if (b.colors?.rotten) update['colors.rotten'] = {}
  if (typeof b.colors?.rotten?.least === 'string') update['colors.rotten.least'] = b.colors!.rotten!.least
  if (typeof b.colors?.rotten?.most === 'string') update['colors.rotten.most'] = b.colors!.rotten!.most

  const updated = await Settings.findOneAndUpdate({ key: 'global' }, update, { new: true, upsert: true })
  return NextResponse.json(updated.toJSON())
}
