#!/usr/bin/env node
/**
 * Migration 002: Rekey boardAreas from board slug to board UUID
 * 
 * WHAT: Converts all card.boardAreas keys from board slug to board UUID
 * WHY: TaggerApp uses UUID-based keys; legacy GridBoard and old cards use slug-based keys
 * 
 * Algorithm:
 * 1. Build slug → UUID mapping from boards collection
 * 2. Find all cards with non-empty boardAreas
 * 3. For each card, rekey boardAreas entries:
 *    - If key is already UUID v4: skip (already migrated)
 *    - If key is slug: look up UUID and rekey
 *    - If slug not found: log warning (orphaned reference)
 * 4. Update card with rekeyed boardAreas
 * 
 * Usage:
 *   Dry run: MIGRATE_DRY_RUN=true node scripts/migrations/002-rekey-boardareas-to-uuid.mjs
 *   Execute:  node scripts/migrations/002-rekey-boardareas-to-uuid.mjs
 */

import { MongoClient } from 'mongodb'
import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * WHAT: Load environment variables from .env.local
 * WHY: Migration scripts need MONGODB_URI from local config
 */
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

/**
 * WHAT: Validate if a string is a valid UUID v4
 * WHY: Need to distinguish between slug keys and UUID keys in boardAreas
 */
function isUUIDv4(str) {
  if (!str || typeof str !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

function isoNow() {
  return new Date().toISOString()
}

async function main() {
  const root = process.cwd()
  const envFile = loadEnvLocal(root)
  const uri = process.env.MONGODB_URI || envFile.MONGODB_URI
  const dbName = process.env.MONGODB_DBNAME || envFile.MONGODB_DBNAME || 'cardmass'
  if (!uri) {
    console.error('MONGODB_URI is not set. Define it in .env.local or environment')
    process.exit(1)
  }

  const dryRun = String(process.env.MIGRATE_DRY_RUN || '').toLowerCase() === 'true'
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)

  try {
    console.log(`[migrate-002] Connected to ${dbName}. dryRun=${dryRun}`)
    console.log(`[migrate-002] Rekeying card.boardAreas from slug to UUID...`)

    // Step 1: Build slug → UUID mapping from boards collection
    const boardsCol = db.collection('boards')
    const boards = await boardsCol.find({ uuid: { $exists: true, $type: 'string' }, slug: { $exists: true, $type: 'string' } }).toArray()
    
    const slugToUUID = new Map()
    const uuidToSlug = new Map()
    
    for (const board of boards) {
      if (board.slug && board.uuid) {
        slugToUUID.set(board.slug, board.uuid)
        uuidToSlug.set(board.uuid, board.slug)
      }
    }
    
    console.log(`[migrate-002] Found ${boards.length} boards with slug and UUID`)
    console.log(`[migrate-002] Built slug→UUID mapping for ${slugToUUID.size} boards`)

    // Step 2: Find all cards with non-empty boardAreas
    const cardsCol = db.collection('cards')
    const cardsCursor = cardsCol.find({ boardAreas: { $exists: true, $ne: null, $ne: {} } })
    
    let totalCards = 0
    let migratedCards = 0
    let skippedCards = 0 // already UUID-keyed
    let orphanedRefs = []
    let rekeyedEntriesCount = 0

    // Step 3: Process each card
    for await (const card of cardsCursor) {
      totalCards++
      
      const oldBoardAreas = card.boardAreas || {}
      const newBoardAreas = {}
      let needsUpdate = false
      let hasOrphan = false

      for (const [key, value] of Object.entries(oldBoardAreas)) {
        if (isUUIDv4(key)) {
          // Already UUID: keep as-is
          newBoardAreas[key] = value
        } else {
          // Treat as slug: look up UUID
          const uuid = slugToUUID.get(key)
          if (uuid) {
            // Rekey from slug to UUID
            newBoardAreas[uuid] = value
            needsUpdate = true
            rekeyedEntriesCount++
            console.log(`[migrate-002]   Card ${card._id}: rekey "${key}" → "${uuid}" (value: "${value}")`)
          } else {
            // Orphaned reference: slug doesn't match any board
            console.warn(`[migrate-002]   WARNING: Card ${card._id} has orphaned boardAreas key "${key}" (no matching board found)`)
            orphanedRefs.push({ cardId: card._id.toString(), cardUuid: card.uuid, key })
            hasOrphan = true
            // Skip this entry (don't carry forward orphaned references)
          }
        }
      }

      // Step 4: Update card if needed
      if (needsUpdate) {
        const patch = { 
          boardAreas: newBoardAreas,
          updatedAt: new Date()
        }
        
        if (!dryRun) {
          await cardsCol.updateOne({ _id: card._id }, { $set: patch })
        }
        
        migratedCards++
      } else if (!hasOrphan) {
        // All keys were already UUIDs
        skippedCards++
      }
    }

    // Step 5: Report results
    const summary = {
      ok: true,
      dryRun,
      stats: {
        totalCardsProcessed: totalCards,
        migratedCards,
        skippedCards,
        rekeyedEntriesCount,
        orphanedReferences: orphanedRefs.length
      },
      boardMapping: {
        totalBoards: boards.length,
        mappedSlugs: slugToUUID.size
      }
    }

    if (orphanedRefs.length > 0) {
      summary.orphanedRefs = orphanedRefs
    }

    console.log(`\n[migrate-002] Migration complete!`)
    console.log(JSON.stringify(summary, null, 2))

    if (dryRun) {
      console.log(`\n[migrate-002] DRY RUN: No changes were made. Run without MIGRATE_DRY_RUN=true to execute.`)
    }

  } finally {
    await client.close()
  }
}

main().catch((e) => { 
  console.error('[migrate-002] ERROR:', e)
  process.exit(1)
})
