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
      status?: { delegate?: string; decide?: string; do?: string; decline?: string }
      matrixAxis?: { important?: string; not_important?: string; urgent?: string; not_urgent?: string }
      proof?: { persona?: string; proposal?: string; outcome?: string; benefit?: string; backlog?: string; journey?: string; validation?: string }
      businessBadges?: {
        key_partners?: string
        key_activities?: string
        key_resources?: string
        value_propositions?: string
        customer_relationships?: string
        channels?: string
        customer_segments?: string
        cost_structure?: string
        revenue_streams?: string
      }
      labels?: { archive?: string }
      textContrast?: {
        status?: { delegate?: boolean; decide?: boolean; do?: boolean; decline?: boolean }
        matrixAxis?: { important?: boolean; not_important?: boolean; urgent?: boolean; not_urgent?: boolean }
        proof?: { persona?: boolean; proposal?: boolean; outcome?: boolean; benefit?: boolean; backlog?: boolean; journey?: boolean; validation?: boolean }
        businessBadges?: {
          key_partners?: boolean
          key_activities?: boolean
          key_resources?: boolean
          value_propositions?: boolean
          customer_relationships?: boolean
          channels?: boolean
          customer_segments?: boolean
          cost_structure?: boolean
          revenue_streams?: boolean
        }
        labels?: { archive?: boolean }
        ranges?: { age?: boolean; rotten?: boolean; archive?: boolean }
      }
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
  const setDoc: Record<string, string | boolean> = {}
  if (typeof b.colors?.age?.oldest === 'string') setDoc['colors.age.oldest'] = b.colors!.age!.oldest!
  if (typeof b.colors?.age?.newest === 'string') setDoc['colors.age.newest'] = b.colors!.age!.newest!
  if (typeof b.colors?.rotten?.least === 'string') setDoc['colors.rotten.least'] = b.colors!.rotten!.least!
  if (typeof b.colors?.rotten?.most === 'string') setDoc['colors.rotten.most'] = b.colors!.rotten!.most!
  if (typeof b.colors?.archive?.oldest === 'string') setDoc['colors.archive.oldest'] = b.colors!.archive!.oldest!
  if (typeof b.colors?.archive?.newest === 'string') setDoc['colors.archive.newest'] = b.colors!.archive!.newest!
  if (typeof b.colors?.status?.delegate === 'string') setDoc['colors.status.delegate'] = b.colors!.status!.delegate!
  if (typeof b.colors?.status?.decide === 'string') setDoc['colors.status.decide'] = b.colors!.status!.decide!
  if (typeof b.colors?.status?.do === 'string') setDoc['colors.status.do'] = b.colors!.status!.do!
  if (typeof b.colors?.status?.decline === 'string') setDoc['colors.status.decline'] = b.colors!.status!.decline!
  if (typeof b.colors?.matrixAxis?.important === 'string') setDoc['colors.matrixAxis.important'] = b.colors!.matrixAxis!.important!
  if (typeof b.colors?.matrixAxis?.not_important === 'string') setDoc['colors.matrixAxis.not_important'] = b.colors!.matrixAxis!.not_important!
  if (typeof b.colors?.matrixAxis?.urgent === 'string') setDoc['colors.matrixAxis.urgent'] = b.colors!.matrixAxis!.urgent!
  if (typeof b.colors?.matrixAxis?.not_urgent === 'string') setDoc['colors.matrixAxis.not_urgent'] = b.colors!.matrixAxis!.not_urgent!
  if (typeof b.colors?.businessBadges?.key_partners === 'string') setDoc['colors.businessBadges.key_partners'] = b.colors!.businessBadges!.key_partners!
  if (typeof b.colors?.businessBadges?.key_activities === 'string') setDoc['colors.businessBadges.key_activities'] = b.colors!.businessBadges!.key_activities!
  if (typeof b.colors?.businessBadges?.key_resources === 'string') setDoc['colors.businessBadges.key_resources'] = b.colors!.businessBadges!.key_resources!
  if (typeof b.colors?.businessBadges?.value_propositions === 'string') setDoc['colors.businessBadges.value_propositions'] = b.colors!.businessBadges!.value_propositions!
  if (typeof b.colors?.businessBadges?.customer_relationships === 'string') setDoc['colors.businessBadges.customer_relationships'] = b.colors!.businessBadges!.customer_relationships!
  if (typeof b.colors?.businessBadges?.channels === 'string') setDoc['colors.businessBadges.channels'] = b.colors!.businessBadges!.channels!
  if (typeof b.colors?.businessBadges?.customer_segments === 'string') setDoc['colors.businessBadges.customer_segments'] = b.colors!.businessBadges!.customer_segments!
  if (typeof b.colors?.businessBadges?.cost_structure === 'string') setDoc['colors.businessBadges.cost_structure'] = b.colors!.businessBadges!.cost_structure!
  if (typeof b.colors?.businessBadges?.revenue_streams === 'string') setDoc['colors.businessBadges.revenue_streams'] = b.colors!.businessBadges!.revenue_streams!
  if (typeof b.colors?.labels?.archive === 'string') setDoc['colors.labels.archive'] = b.colors!.labels!.archive!
  if (typeof b.colors?.textContrast?.status?.delegate === 'boolean') setDoc['colors.textContrast.status.delegate'] = b.colors!.textContrast!.status!.delegate!
  if (typeof b.colors?.textContrast?.status?.decide === 'boolean') setDoc['colors.textContrast.status.decide'] = b.colors!.textContrast!.status!.decide!
  if (typeof b.colors?.textContrast?.status?.do === 'boolean') setDoc['colors.textContrast.status.do'] = b.colors!.textContrast!.status!.do!
  if (typeof b.colors?.textContrast?.status?.decline === 'boolean') setDoc['colors.textContrast.status.decline'] = b.colors!.textContrast!.status!.decline!
  if (typeof b.colors?.textContrast?.matrixAxis?.important === 'boolean') setDoc['colors.textContrast.matrixAxis.important'] = b.colors!.textContrast!.matrixAxis!.important!
  if (typeof b.colors?.textContrast?.matrixAxis?.not_important === 'boolean') setDoc['colors.textContrast.matrixAxis.not_important'] = b.colors!.textContrast!.matrixAxis!.not_important!
  if (typeof b.colors?.textContrast?.matrixAxis?.urgent === 'boolean') setDoc['colors.textContrast.matrixAxis.urgent'] = b.colors!.textContrast!.matrixAxis!.urgent!
  if (typeof b.colors?.textContrast?.matrixAxis?.not_urgent === 'boolean') setDoc['colors.textContrast.matrixAxis.not_urgent'] = b.colors!.textContrast!.matrixAxis!.not_urgent!
  if (typeof b.colors?.textContrast?.businessBadges?.key_partners === 'boolean') setDoc['colors.textContrast.businessBadges.key_partners'] = b.colors!.textContrast!.businessBadges!.key_partners!
  if (typeof b.colors?.textContrast?.businessBadges?.key_activities === 'boolean') setDoc['colors.textContrast.businessBadges.key_activities'] = b.colors!.textContrast!.businessBadges!.key_activities!
  if (typeof b.colors?.textContrast?.businessBadges?.key_resources === 'boolean') setDoc['colors.textContrast.businessBadges.key_resources'] = b.colors!.textContrast!.businessBadges!.key_resources!
  if (typeof b.colors?.textContrast?.businessBadges?.value_propositions === 'boolean') setDoc['colors.textContrast.businessBadges.value_propositions'] = b.colors!.textContrast!.businessBadges!.value_propositions!
  if (typeof b.colors?.textContrast?.businessBadges?.customer_relationships === 'boolean') setDoc['colors.textContrast.businessBadges.customer_relationships'] = b.colors!.textContrast!.businessBadges!.customer_relationships!
  if (typeof b.colors?.textContrast?.businessBadges?.channels === 'boolean') setDoc['colors.textContrast.businessBadges.channels'] = b.colors!.textContrast!.businessBadges!.channels!
  if (typeof b.colors?.textContrast?.businessBadges?.customer_segments === 'boolean') setDoc['colors.textContrast.businessBadges.customer_segments'] = b.colors!.textContrast!.businessBadges!.customer_segments!
  if (typeof b.colors?.textContrast?.businessBadges?.cost_structure === 'boolean') setDoc['colors.textContrast.businessBadges.cost_structure'] = b.colors!.textContrast!.businessBadges!.cost_structure!
  if (typeof b.colors?.textContrast?.businessBadges?.revenue_streams === 'boolean') setDoc['colors.textContrast.businessBadges.revenue_streams'] = b.colors!.textContrast!.businessBadges!.revenue_streams!
  if (typeof b.colors?.textContrast?.labels?.archive === 'boolean') setDoc['colors.textContrast.labels.archive'] = b.colors!.textContrast!.labels!.archive!
  if (typeof b.colors?.textContrast?.ranges?.age === 'boolean') setDoc['colors.textContrast.ranges.age'] = b.colors!.textContrast!.ranges!.age!
  if (typeof b.colors?.textContrast?.ranges?.rotten === 'boolean') setDoc['colors.textContrast.ranges.rotten'] = b.colors!.textContrast!.ranges!.rotten!
  if (typeof b.colors?.textContrast?.ranges?.archive === 'boolean') setDoc['colors.textContrast.ranges.archive'] = b.colors!.textContrast!.ranges!.archive!
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
