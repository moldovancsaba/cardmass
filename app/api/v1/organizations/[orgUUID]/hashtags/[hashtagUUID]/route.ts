import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { computeHashtagUUID } from '@/lib/hashtag'
import type { CardDoc } from '@/lib/types'

interface OrgCardDoc extends CardDoc {
  uuid: string
  organizationId: string
}

export async function GET(_req: Request, ctx: { params: Promise<{ orgUUID: string, hashtagUUID: string }> }) {
  const { orgUUID, hashtagUUID } = await ctx.params
  try {
    const db = await getDb()
    const col = db.collection<OrgCardDoc>('cards')
    const docs = await col.find({ organizationId: orgUUID }).toArray()

    // First pass: find the (boardKey,label) pair matching the UUID
    let match: { boardKey: string; label: string } | null = null
    for (const d of docs) {
      const ba = (d.boardAreas || {}) as Record<string, string>
      for (const [boardKey, rawLabel] of Object.entries(ba)) {
        const label = String(rawLabel || '').toLowerCase()
        if (!boardKey || !label) continue
        const uid = computeHashtagUUID(orgUUID, boardKey, label)
        if (uid === hashtagUUID) { match = { boardKey, label }; break }
      }
      if (match) break
    }

    if (!match) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Hashtag not found' } }, { status: 404 })

    // Second pass: filter cards having this (boardKey,label)
    const cards = docs.filter(d => {
      const ba = (d.boardAreas || {}) as Record<string, string>
      const v = (ba[match!.boardKey] || '').toLowerCase()
      return v === match!.label && d.isArchived !== true
    }).map(d => ({
      id: d._id ? d._id.toString() : '',
      uuid: d.uuid,
      organizationId: d.organizationId,
      text: d.text,
      status: d.status,
      order: d.order,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      boardAreas: d.boardAreas || undefined,
    }))

    return NextResponse.json({
      uuid: hashtagUUID,
      boardKey: match.boardKey,
      label: match.label,
      count: cards.length,
      cards,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 })
  }
}
