import { getDb } from "@/lib/db";
import type { Board } from "@/lib/types";
import { notFound } from "next/navigation";
import SpockBar from "./SpockBar";
import GridBoard from './GridBoard'

export default async function UseBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const doc = await db.collection<Board>("boards").findOne({ slug });
  if (!doc) return notFound();
  const board = doc;

  // Fetch all board slugs (server-side) for SPOCK navigation; sort alphabetically for deterministic order.
  const all = await db
    .collection<Board>("boards")
    .find({}, { projection: { _id: 0, slug: 1 } })
    .sort({ slug: 1 })
    .toArray();
  const boardSlugs = all.map(b => b.slug).filter((s): s is string => typeof s === 'string');

  // Build tile->area mapping
  const tileToArea = new Map<string, { label: string; color: string }>();
  for (const a of board.areas) {
    for (const t of a.tiles) tileToArea.set(t, { label: a.label, color: a.color });
  }

  const hasSpock = board.areas.some(a => (a.label || '').toLowerCase() === 'spock');

  // Build merged rectangles per label (bounding boxes)
  type Box = { label: string; color: string; minR: number; minC: number; maxR: number; maxC: number }
  const boxes = new Map<string, Box>()
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const id = `${r}-${c}`
      const a = tileToArea.get(id)
      if (!a) continue
      const key = (a.label || '').toLowerCase()
      const b = boxes.get(key)
      if (!b) {
        boxes.set(key, { label: key, color: a.color, minR: r, minC: c, maxR: r, maxC: c })
      } else {
        b.minR = Math.min(b.minR, r)
        b.minC = Math.min(b.minC, c)
        b.maxR = Math.max(b.maxR, r)
        b.maxC = Math.max(b.maxC, c)
      }
    }
  }

  const contentHeightPx = 96 // height reserved for SPOCK

  // Convert to serializable array with stable keys
  const boxArr = Array.from(boxes.entries()).map(([key, b]) => ({ key, label: b.label, color: b.color, minR: b.minR, minC: b.minC, maxR: b.maxR, maxC: b.maxC }))

  return (
    <main className="h-dvh flex flex-col bg-white text-black">
      <div className="w-full" style={{ height: `calc(100dvh - ${contentHeightPx}px)` }}>
        <div className="w-full h-full">
          {/* Client DnD grid that matches the exact row/col ratio */}
          <GridBoard boardSlug={board.slug} rows={board.rows} cols={board.cols} boxes={boxArr} />
        </div>
      </div>

      <SpockBar disabled={!hasSpock} boardSlug={board.slug} boardSlugs={boardSlugs} />
    </main>
  );
}
