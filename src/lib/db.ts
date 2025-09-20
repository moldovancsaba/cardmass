import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DBNAME || "cardmass";
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Define it in .env.local");
  }
  if (db) return db;
  if (!client) client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}
