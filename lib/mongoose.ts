import mongoose from 'mongoose'

// We cache the mongoose connection across HMR in dev to avoid creating
// new connections on every file change. This ensures a single pooled
// connection per process and avoids connection storms.

const MONGODB_URI = process.env.MONGODB_URI as string
if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI. Define it in .env.local')
}

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
const globalWithCache = global as typeof global & { mongooseCache?: MongooseCache }

let cached = globalWithCache.mongooseCache
if (!cached) {
  cached = { conn: null, promise: null }
  globalWithCache.mongooseCache = cached
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn
  }
  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'cardmass',
    })
  }
  cached!.conn = await cached!.promise
  return cached!.conn
}
