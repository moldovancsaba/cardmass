import { isUUIDv4 } from '@/lib/validation'
import { fetchWithOrg } from '@/lib/http/fetchWithOrg'
import { headers } from 'next/headers'
// Area is a TS type — use type-only import to avoid emitting a runtime binding that could break Next.js module resolution in production builds.
import TaggerApp from './TaggerApp'
import type { Area } from './TaggerApp'

// TAGGER — new board page from zero: reliable grid + inbox tagging UI

type BoardDetails = { uuid: string; rows: number; cols: number; areas: Area[] }

export default async function TaggerPage(ctx: { params: Promise<{ organizationUUID: string, boardUUID: string }> }) {
  const { organizationUUID: org, boardUUID: boardId } = await ctx.params
  if (!isUUIDv4(org) || !isUUIDv4(boardId)) {
    return (
      <main className="min-h-dvh p-6"><h1 className="text-xl font-semibold">Invalid URL</h1></main>
    )
  }

  async function getBaseURL(): Promise<string> {
    const h = await headers()
    const proto = h.get('x-forwarded-proto') ?? 'http'
    const host = h.get('x-forwarded-host') ?? h.get('host')
    if (host) return `${proto}://${host}`
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'
  }

  let rows = 0
  let cols = 0
  let areas: Area[] = []
  try {
    const base = await getBaseURL()
    const data = await fetchWithOrg<BoardDetails>(`${base}/api/v1/organizations/${encodeURIComponent(org)}/boards/${encodeURIComponent(boardId)}`, org, { cache: 'no-store' })
    rows = Number(data?.rows) || 0
    cols = Number(data?.cols) || 0
    areas = Array.isArray(data?.areas) ? data.areas : []
  } catch {}

  return (
    <main className="min-h-screen bg-white">
      <TaggerApp orgUUID={org} boardUUID={boardId} rows={rows} cols={cols} areas={areas} />
    </main>
  )
}
