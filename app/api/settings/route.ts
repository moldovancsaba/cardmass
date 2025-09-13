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
      archive?: { oldest?: string; newest?: string }
    }
  }>

  // Build a $set doc with only provided dotted fields to avoid conflicts
  const setDoc: Record<string, string> = {}
  if (typeof b.colors?.age?.oldest === 'string') setDoc['colors.age.oldest'] = b.colors!.age!.oldest!
  if (typeof b.colors?.age?.newest === 'string') setDoc['colors.age.newest'] = b.colors!.age!.newest!
  if (typeof b.colors?.rotten?.least === 'string') setDoc['colors.rotten.least'] = b.colors!.rotten!.least!
  if (typeof b.colors?.rotten?.most === 'string') setDoc['colors.rotten.most'] = b.colors!.rotten!.most!
  if (typeof b.colors?.archive?.oldest === 'string') setDoc['colors.archive.oldest'] = b.colors!.archive!.oldest!
  if (typeof b.colors?.archive?.newest === 'string') setDoc['colors.archive.newest'] = b.colors!.archive!.newest!

  try {
    const updated = await Settings.findOneAndUpdate(
      { key: 'global' },
      Object.keys(setDoc).length ? { $set: setDoc } : {},
      { new: true, upsert: true, runValidators: true }
    )
    return NextResponse.json(updated.toJSON())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
