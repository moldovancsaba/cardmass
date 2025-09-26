#!/usr/bin/env node
// scripts/debug/print-boards.mjs
// What: Print boards for a given organization UUID to verify creation
// Usage: node scripts/debug/print-boards.mjs <orgUUID>

import { config as loadEnv } from 'dotenv'
import { MongoClient } from 'mongodb'

// Load .env.local (Next.js convention) then fallback to .env
loadEnv({ path: '.env.local' })
loadEnv()

async function main() {
  const org = process.argv[2]
  if (!org) { console.error('Usage: node scripts/debug/print-boards.mjs <orgUUID>'); process.exit(1) }
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DBNAME || 'cardmass'
  if (!uri) { console.error('MONGODB_URI missing in environment'); process.exit(1) }

  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)
    const boards = await db.collection('boards').find({ organizationId: org }).project({ _id: 0, uuid: 1, slug: 1, rows: 1, cols: 1, updatedAt: 1 }).sort({ updatedAt: -1 }).toArray()
    console.log(JSON.stringify({ org, count: boards.length, boards }, null, 2))
  } finally {
    await client.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
