#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { MongoClient } from 'mongodb'

function loadEnvLocal(root) {
  const p = path.join(root, '.env.local')
  if (!fs.existsSync(p)) return {}
  const text = fs.readFileSync(p, 'utf8')
  const out = {}
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) {
      const key = m[1]
      let val = m[2]
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1)
      }
      out[key] = val
    }
  }
  return out
}

async function main() {
  const root = process.cwd()
  const envFile = loadEnvLocal(root)
  const uri = process.env.MONGODB_URI || envFile.MONGODB_URI
  const dbName = process.env.MONGODB_DBNAME || envFile.MONGODB_DBNAME || 'cardmass'
  if (!uri) {
    console.error('ERROR: MONGODB_URI not found in environment or .env.local')
    process.exit(1)
  }
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  const cols = await db.listCollections().toArray()
  console.log(`[info] Connected. Database: ${dbName}. Collections found: ${cols.map(c => c.name).join(', ') || '(none)'}\n`)
  const res = await db.dropDatabase()
  console.log(`[done] dropDatabase result: ${JSON.stringify(res)}`)
  const colsAfter = await db.listCollections().toArray()
  console.log(`[verify] Collections after drop: ${colsAfter.length}`)
  await client.close()
}

main().catch((e) => { console.error(e?.message || e); process.exit(1) })