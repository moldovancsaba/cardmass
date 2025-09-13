#!/usr/bin/env node
// Migration script: map legacy statuses to new ones
// roadmap -> delegate, backlog -> decide, todo -> do
import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI
if (!uri) { throw new Error('Missing MONGODB_URI') }

async function main() {
  await mongoose.connect(uri, { dbName: 'cardmass' })
  const Card = mongoose.connection.collection('cards')
  const ops = [
    { updateMany: { filter: { status: 'roadmap' }, update: { $set: { status: 'delegate' } } } },
    { updateMany: { filter: { status: 'backlog' }, update: { $set: { status: 'decide' } } } },
    { updateMany: { filter: { status: 'todo' }, update: { $set: { status: 'do' } } } },
  ]
  for (const op of ops) {
    const updateMany = op.updateMany
    const res = await Card.updateMany(updateMany.filter, updateMany.update)
    console.log(`Updated ${res.modifiedCount} docs for`, JSON.stringify(updateMany.filter))
  }
  await mongoose.disconnect()
}

main().catch(async (e) => { console.error(e); try { await mongoose.disconnect() } catch {}; process.exit(1) })
