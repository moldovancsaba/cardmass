import SpockNav from "@/components/SpockNav";

import { getDb } from "@/lib/db";
import type { Board } from "@/lib/types";

export default async function AdminPage() {
  const db = await getDb();
  const docs = await db
    .collection<Board>("boards")
    .find({}, { projection: { slug: 1, updatedAt: 1, version: 1, _id: 0 } })
    .sort({ updatedAt: -1 })
    .toArray();
  const boards = docs.map(d => ({ slug: d.slug, updatedAt: d.updatedAt, version: d.version }));

  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Pages</h1>
        {boards.length === 0 ? (
          <div className="text-sm opacity-70">No pages found.</div>
        ) : (
          <ul className="divide-y divide-black/10 border border-black/10 rounded">
            {boards.map((b: { slug: string; updatedAt?: Date; version?: number }) => (
              <li key={b.slug} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.slug}</div>
                  {b.updatedAt && (
                    <div className="text-xs opacity-60">updated {new Date(b.updatedAt).toLocaleString()}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a className="underline" href={`/use/${encodeURIComponent(b.slug)}`}>open</a>
                  <a className="underline" href={`/creator?load=${encodeURIComponent(b.slug)}`}>edit</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
