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
    business: Partial<{
      key_partners: string
      key_activities: string
      key_resources: string
      value_propositions: string
      customer_relationships: string
      channels: string
      customer_segments: string
      cost_structure: string
      revenue_streams: string
    }>
  }>

  // Build a $set doc with only provided dotted fields to avoid conflicts
  const setDoc: Record<string, string> = {}
  if (typeof b.colors?.age?.oldest === 'string') setDoc['colors.age.oldest'] = b.colors!.age!.oldest!
  if (typeof b.colors?.age?.newest === 'string') setDoc['colors.age.newest'] = b.colors!.age!.newest!
  if (typeof b.colors?.rotten?.least === 'string') setDoc['colors.rotten.least'] = b.colors!.rotten!.least!
  if (typeof b.colors?.rotten?.most === 'string') setDoc['colors.rotten.most'] = b.colors!.rotten!.most!
  if (typeof b.colors?.archive?.oldest === 'string') setDoc['colors.archive.oldest'] = b.colors!.archive!.oldest!
  if (typeof b.colors?.archive?.newest === 'string') setDoc['colors.archive.newest'] = b.colors!.archive!.newest!
  if (typeof b.business?.key_partners === 'string') setDoc['business.key_partners'] = b.business!.key_partners!
  if (typeof b.business?.key_activities === 'string') setDoc['business.key_activities'] = b.business!.key_activities!
  if (typeof b.business?.key_resources === 'string') setDoc['business.key_resources'] = b.business!.key_resources!
  if (typeof b.business?.value_propositions === 'string') setDoc['business.value_propositions'] = b.business!.value_propositions!
  if (typeof b.business?.customer_relationships === 'string') setDoc['business.customer_relationships'] = b.business!.customer_relationships!
  if (typeof b.business?.channels === 'string') setDoc['business.channels'] = b.business!.channels!
  if (typeof b.business?.customer_segments === 'string') setDoc['business.customer_segments'] = b.business!.customer_segments!
  if (typeof b.business?.cost_structure === 'string') setDoc['business.cost_structure'] = b.business!.cost_structure!
  if (typeof b.business?.revenue_streams === 'string') setDoc['business.revenue_streams'] = b.business!.revenue_streams!

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
