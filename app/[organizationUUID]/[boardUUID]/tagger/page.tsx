import { isUUIDv4 } from '@/lib/validation'
import { fetchWithOrg } from '@/lib/http/fetchWithOrg'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { validateAdminToken, checkOrgAccess } from '@/lib/auth'
import TaggerWithAuth from './TaggerWithAuth'
import type { Area } from './TaggerApp'

// TAGGER — Zero-trust authenticated board page

type BoardDetails = { uuid: string; rows: number; cols: number; areas: Area[]; background?: string }

export default async function TaggerPage(ctx: { params: Promise<{ organizationUUID: string, boardUUID: string }> }) {
  const { organizationUUID: org, boardUUID: boardId } = await ctx.params
  if (!isUUIDv4(org) || !isUUIDv4(boardId)) {
    return (
      <main className="min-h-dvh p-6"><h1 className="text-xl font-semibold">Invalid URL</h1></main>
    )
  }
  
  // WHAT: Check authentication and org access (in addition to PasswordGate)
  // WHY: Users must have org access to view boards (password gate is secondary layer)
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (token) {
    const user = await validateAdminToken(token);
    if (user && user._id) {
      const orgRole = await checkOrgAccess(user._id.toString(), org);
      if (!orgRole) {
        // User is authenticated but doesn't have access to this org
        redirect('/organizations');
      }
    }
  }
  // If no token, PasswordGate will handle auth prompt

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
  let background: string | undefined = undefined
  try {
    const base = await getBaseURL()
    const data = await fetchWithOrg<BoardDetails>(`${base}/api/v1/organizations/${encodeURIComponent(org)}/boards/${encodeURIComponent(boardId)}`, org, { cache: 'no-store' })
    rows = Number(data?.rows) || 0
    cols = Number(data?.cols) || 0
    areas = Array.isArray(data?.areas) ? data.areas : []
    background = data?.background
  } catch {}

  function parseBackgroundCSS(css: string | undefined): React.CSSProperties {
    if (!css || typeof css !== 'string') return {}
    const out: Record<string, string> = {}
    css.split(/;\s*/).forEach((decl) => {
      const idx = decl.indexOf(':')
      if (idx === -1) return
      const prop = decl.slice(0, idx).trim().toLowerCase()
      const val = decl.slice(idx + 1).trim()
      // allow only background-* props for safety
      if (!prop.startsWith('background')) return
      const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      out[camel] = val
    })
    return out as React.CSSProperties
  }

  const backgroundStyle = parseBackgroundCSS(background)

  return (
    <main className="min-h-screen" style={backgroundStyle}>
      <TaggerWithAuth orgUUID={org} boardUUID={boardId} rows={rows} cols={cols} areas={areas} />
    </main>
  )
}
