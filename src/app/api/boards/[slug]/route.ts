import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Board, Area } from "@/lib/types";

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
