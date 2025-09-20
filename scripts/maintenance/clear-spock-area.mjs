#!/usr/bin/env node
// scripts/maintenance/clear-spock-area.mjs
// What: One-off maintenance to clear any legacy persisted 'spock' in cards.areaLabel
// Why: 'spock' is a virtual inbox per board and must never be persisted on cards

import 'dotenv/config'
import { MongoClient } from 'mongodb'

async function main() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DBNAME || 'cardmass'
  if (!uri) {
    console.error('MONGODB_URI is not set. Define it in .env.local')
    process.exit(1)
  }
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)
    const col = db.collection('cards')
    const res = await col.updateMany(
      { areaLabel: { $regex: /^spock$/i } },
      { $set: { areaLabel: '' } }
    )
    console.log(`Cleared persisted 'spock' from ${res.modifiedCount} card(s).`)
  } finally {
    await client.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
