#!/usr/bin/env node
import { MongoClient } from 'mongodb'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Tiny local UUID v4 (non-crypto) fallback to avoid adding deps. For production, Node 18+ has crypto.randomUUID; this script uses fallback only.
function uuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  })
}

function isoNow() {
  return new Date().toISOString()
}

async function ensureIndexes(db) {
  // Organizations
  await db.collection('organizations').createIndex({ uuid: 1 }, { unique: true })
  await db.collection('organizations').createIndex({ slug: 1 }, { unique: true })
  // Boards
  await db.collection('boards').createIndex({ organizationId: 1 })
  // Unique on uuid, but ignore missing/null by using partial filter on string type
  try {
    await db.collection('boards').createIndex(
      { uuid: 1 },
      { unique: true, partialFilterExpression: { uuid: { $type: 'string' } } }
    )
  } catch (e) {
    if (!(e && (e.code === 86 || e.codeName === 'IndexKeySpecsConflict'))) throw e
  }
  // Cards
  await db.collection('cards').createIndex({ organizationId: 1, status: 1, updatedAt: -1 })
  try {
    await db.collection('cards').createIndex(
      { uuid: 1 },
      { unique: true, partialFilterExpression: { uuid: { $type: 'string' } } }
    )
  } catch (e) {
    if (!(e && (e.code === 86 || e.codeName === 'IndexKeySpecsConflict'))) throw e
  }
}

async function main() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DBNAME || 'cardmass'
  if (!uri) {
    console.error('MONGODB_URI is not set. Define it in .env.local or environment')
    process.exit(1)
  }
  const dryRun = String(process.env.MIGRATE_DRY_RUN || '').toLowerCase() === 'true'
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)

  try {
    console.log(`[migrate] Connected to ${dbName}. dryRun=${dryRun}`)

    // 1) Ensure organizations collection and indexes
    await ensureIndexes(db)

    // 2) Default organization (if missing)
    const orgsCol = db.collection('organizations')
    let defaultOrg = await orgsCol.findOne({ slug: 'default' })
    if (!defaultOrg) {
      defaultOrg = {
        uuid: uuidV4(),
        name: 'Default Organization',
        slug: 'default',
        description: 'Auto-generated default org for migration',
        isActive: true,
        createdAt: isoNow(),
        updatedAt: isoNow(),
      }
      console.log(`[migrate] Inserting default organization ${defaultOrg.uuid}`)
      if (!dryRun) {
        await orgsCol.insertOne(defaultOrg)
      }
    } else {
      // Ensure uuid exists for default org
      if (!defaultOrg.uuid) {
        defaultOrg.uuid = uuidV4()
        console.log(`[migrate] Backfilling uuid for default org slug=default uuid=${defaultOrg.uuid}`)
        if (!dryRun) {
          await orgsCol.updateOne({ _id: defaultOrg._id }, { $set: { uuid: defaultOrg.uuid, updatedAt: isoNow() } })
        }
      }
    }

    // 3) Boards backfill
    const boardsCol = db.collection('boards')
    const boardsCursor = boardsCol.find({ $or: [ { uuid: { $exists: false } }, { organizationId: { $exists: false } } ] })
    let boardsUpdated = 0
    for await (const b of boardsCursor) {
      const patch = { }
      if (!b.uuid) patch.uuid = uuidV4()
      if (!b.organizationId) patch.organizationId = defaultOrg.uuid
      patch.updatedAt = isoNow()
      console.log(`[migrate] Boards backfill _id=${b._id} ${JSON.stringify(patch)}`)
      if (!dryRun) await boardsCol.updateOne({ _id: b._id }, { $set: patch })
      boardsUpdated++
    }

    // 4) Cards backfill
    const cardsCol = db.collection('cards')
    const cardsCursor = cardsCol.find({ $or: [ { uuid: { $exists: false } }, { organizationId: { $exists: false } } ] })
    let cardsUpdated = 0
    for await (const c of cardsCursor) {
      const patch = { }
      if (!c.uuid) patch.uuid = uuidV4()
      if (!c.organizationId) patch.organizationId = defaultOrg.uuid
      patch.updatedAt = isoNow()
      console.log(`[migrate] Cards backfill _id=${c._id} ${JSON.stringify(patch)}`)
      if (!dryRun) await cardsCol.updateOne({ _id: c._id }, { $set: patch })
      cardsUpdated++
    }

    // 5) Ensure indexes again (in case collections were empty before)
    await ensureIndexes(db)

    console.log(JSON.stringify({ ok: true, dryRun, boardsUpdated, cardsUpdated, defaultOrg: { uuid: defaultOrg.uuid, slug: defaultOrg.slug } }, null, 2))
  } finally {
    await client.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })