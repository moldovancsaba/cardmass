#!/usr/bin/env node
// scripts/admin/purge-boards.mjs
// DANGER: Purges all boards across all organizations. Cards remain intact.
// Usage:
//   DRY_RUN=1 node scripts/admin/purge-boards.mjs
//   node scripts/admin/purge-boards.mjs --confirm ALL

import { config as loadEnv } from 'dotenv'
import { MongoClient } from 'mongodb'

loadEnv({ path: '.env.local' })
loadEnv()

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DBNAME || 'cardmass'
if (!uri) {
  console.error('MONGODB_URI is not set. Define it in .env.local')
  process.exit(1)
}
const DRY_RUN = !!process.env.DRY_RUN
const confirm = process.argv.slice(2).join(' ')

if (!DRY_RUN && confirm !== '--confirm ALL') {
  console.error('Refusing to purge without explicit confirmation. Run with DRY_RUN=1 to preview, or pass --confirm ALL to execute.')
  process.exit(1)
}

async function main() {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)
    const boards = db.collection('boards')
    const total = await boards.countDocuments()
    if (DRY_RUN) {
      console.log(JSON.stringify({ dryRun: true, totalBoards: total }, null, 2))
      return
    }
    const res = await boards.deleteMany({})
    console.log(JSON.stringify({ ok: true, deleted: res.deletedCount || 0 }, null, 2))
  } finally {
    await client.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
