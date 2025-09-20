import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Board, Area, CardDoc } from "@/lib/types";

// GET /api/boards/[slug] — fetch a board by slug
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  try {
    const db = await getDb();
    const doc = await db.collection<Board>("boards").findOne({ slug });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Serialize Date to ISO
    return NextResponse.json({
      ...doc,
      createdAt: doc.createdAt?.toISOString?.() ?? null,
      updatedAt: doc.updatedAt?.toISOString?.() ?? null,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/boards/[slug] — upsert a board by slug
export async function PUT(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  let body: Partial<Pick<Board, "rows" | "cols" | "areas">> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = Number(body.rows) || 1;
  const cols = Number(body.cols) || 1;
  const areas = Array.isArray(body.areas) ? (body.areas as Area[]) : [];

  try {
    const db = await getDb();
    const now = new Date();
    const existing = await db.collection<Board>("boards").findOne({ slug });
    const version = existing ? existing.version + 1 : 1;

    const update = {
      $set: { slug, rows, cols, areas, updatedAt: now, version },
      $setOnInsert: { createdAt: now },
    };

    await db.collection("boards").updateOne({ slug }, update, { upsert: true });
    return NextResponse.json({ ok: true, slug, version });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/boards/[slug] — update a specific area (label/color/tiles); propagate label rename to cards
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  // Body accepts either "updateArea" shape or a flat payload
  let body: {
    oldLabel?: string
    label?: string
    color?: string
    tiles?: string[]
  } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const oldLabel = (body.oldLabel || '').trim()
  const newLabel = (body.label || '').trim()
  const color = typeof body.color === 'string' ? body.color : undefined
  const tiles = Array.isArray(body.tiles) ? body.tiles.map(String) : undefined

  if (!oldLabel) return NextResponse.json({ error: 'oldLabel is required' }, { status: 400 })

  try {
    const db = await getDb()
    const boardsCol = db.collection<Board>('boards')
    const cardsCol = db.collection<CardDoc>('cards')
    const board = await boardsCol.findOne({ slug })
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })

    // Find target area by oldLabel
    const idx = (board.areas || []).findIndex(a => (a.label || '').toLowerCase() === oldLabel.toLowerCase())
    if (idx === -1) return NextResponse.json({ error: `Area '${oldLabel}' not found` }, { status: 404 })

    const updatedAreas = [...(board.areas || [])]
    const target = { ...updatedAreas[idx] }
    if (newLabel) target.label = newLabel
    if (color) target.color = color
    if (tiles) target.tiles = tiles
    updatedAreas[idx] = target

    const now = new Date()
    // Update board document
    await boardsCol.updateOne({ slug }, { $set: { areas: updatedAreas, updatedAt: now, version: (board.version || 0) + 1 } })

    let updatedCards = 0
    if (newLabel && newLabel !== oldLabel) {
      // Propagate rename to cards.boardAreas[slug] where equals oldLabel
      const q: Record<string, unknown> = {}
      q[`boardAreas.${slug}`] = oldLabel
      const u: { $set: Record<string, unknown> } = { $set: {} }
      u.$set[`boardAreas.${slug}`] = newLabel
      const res = await cardsCol.updateMany(q, u)
      updatedCards = res.modifiedCount || 0

      // Optional: also update deprecated areaLabel if present and linked by boardSlug
      const res2 = await cardsCol.updateMany({ boardSlug: slug, areaLabel: oldLabel }, { $set: { areaLabel: newLabel, updatedAt: new Date() } })
      updatedCards += res2.modifiedCount || 0
    }

    return NextResponse.json({ ok: true, slug, area: target, updatedCards })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/boards/[slug] — delete a board by slug
export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  try {
    const db = await getDb();
    const res = await db.collection("boards").deleteOne({ slug });
    return NextResponse.json({ ok: true, deleted: res.deletedCount });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
