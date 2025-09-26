#!/usr/bin/env node
// scripts/debug/print-board.mjs
// Print board details by uuid, including areas and sample tiles
// Usage: node scripts/debug/print-board.mjs <boardUUID>

import { config as loadEnv } from 'dotenv'
import { MongoClient } from 'mongodb'

loadEnv({ path: '.env.local' })
loadEnv()

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DBNAME || 'cardmass'
if (!uri) { console.error('MONGODB_URI missing'); process.exit(1) }

const boardUUID = process.argv[2]
if (!boardUUID) { console.error('Usage: node scripts/debug/print-board.mjs <boardUUID>'); process.exit(1) }

async function main() {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)
    const b = await db.collection('boards').findOne({ uuid: boardUUID })
    if (!b) { console.log(JSON.stringify({ ok: false, message: 'Board not found' }, null, 2)); return }
    const out = {
      uuid: b.uuid,
      slug: b.slug,
      rows: b.rows,
      cols: b.cols,
      areasCount: Array.isArray(b.areas) ? b.areas.length : 0,
      areas: Array.isArray(b.areas) ? b.areas.slice(0, 3).map(a => ({ label: a.label, color: a.color, tiles: Array.isArray(a.tiles) ? a.tiles.slice(0, 10) : [] })) : []
    }
    console.log(JSON.stringify(out, null, 2))
  } finally {
    await client.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
