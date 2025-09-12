#!/usr/bin/env node
import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('Missing MONGODB_URI')
  process.exit(1)
}

const CardSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  status: { type: String, enum: ['roadmap', 'backlog', 'todo'], default: 'backlog', index: true },
}, { timestamps: true })

const Card = mongoose.models._VerifyCard || mongoose.model('_VerifyCard', CardSchema, 'cards')

async function main() {
  await mongoose.connect(uri, { dbName: 'cardmass' })
  const now = new Date().toISOString()
  const created = await Card.create({ text: `verify ${now}`, status: 'backlog' })
  const id = created._id.toString()
  const patched = await Card.findByIdAndUpdate(id, { status: 'todo', text: `verify edited ${now}` }, { new: true })
  const deleted = await Card.findByIdAndDelete(id)
  console.log(JSON.stringify({ ok: true, id, createdAt: created.createdAt, updatedAt: patched?.updatedAt }, null, 2))
  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
