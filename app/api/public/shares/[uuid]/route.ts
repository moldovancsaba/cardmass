import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongoose'
import { Share } from '@/models/Share'

export const runtime = 'nodejs'

// GET /api/public/shares/[uuid]
export async function GET(_req: Request, context: unknown) {
  await connectToDatabase()
  const { params } = (context ?? {}) as { params?: { uuid?: string } }
  const uuid = params?.uuid
  if (!uuid) return NextResponse.json({ error: 'Missing uuid' }, { status: 400 })
  const share = await Share.findOne({ uuid })
  if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(share.toJSON())
}
