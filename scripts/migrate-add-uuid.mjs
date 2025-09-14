#!/usr/bin/env node
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'
import { Card } from '../models/Card.js'
import 'dotenv/config'

async function main() {
  const dry = process.argv.includes('--dry')
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Missing MONGODB_URI')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const q = { $or: [{ uuid: { $exists: false } }, { uuid: null }, { uuid: '' }] }
  const total = await Card.countDocuments(q)
  console.log(`Found ${total} cards missing uuid`)
  if (dry) { await mongoose.disconnect(); return }
  const cursor = Card.find(q).cursor()
  let i = 0
  for await (const doc of cursor) {
    doc.uuid = randomUUID()
    await doc.save()
    i++
    if (i % 100 === 0) console.log(`Updated ${i}/${total}`)
  }
  console.log(`Done. Updated ${i} documents.`)
  await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
