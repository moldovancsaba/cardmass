#!/usr/bin/env node
// Backfill 'order' field for existing cards per status, preserving current visual order.
// Strategy: for each status, fetch all docs (archived and non-archived) sorted by updatedAt desc,
// then assign order = index (0..N). This mirrors the previous UI sorting by updatedAt desc.
// Why: Establishes a stable baseline so future fractional reordering works predictably.

import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('Missing MONGODB_URI')
  process.exit(1)
}

const STATUSES = ['delegate','decide','do','decline']

async function main() {
  const dry = process.argv.includes('--dry')
  await mongoose.connect(uri, { dbName: 'cardmass' })
  const Coll = mongoose.connection.collection('cards')
  let total = 0
  for (const s of STATUSES) {
    const docs = await Coll.find({ status: s }).sort({ updatedAt: -1 }).toArray()
    const ops = docs.map((doc, idx) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { order: idx } },
      }
    }))
    console.log(`status=${s} docs=${docs.length}`)
    if (!dry && ops.length) {
      const res = await Coll.bulkWrite(ops)
      console.log(`  modified=${res.modifiedCount}`)
      total += res.modifiedCount
    }
  }
  await mongoose.disconnect()
  console.log(JSON.stringify({ ok: true, dry, total }, null, 2))
}

main().catch(async (e) => {
  console.error(e)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})