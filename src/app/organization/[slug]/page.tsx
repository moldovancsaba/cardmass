
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

async function getBaseURL(): Promise<string> {
  // Prefer forwarded headers (proxy/CDN) and fall back to host; default to localhost in dev
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'
}

async function fetchOrgBySlug(slug: string) {
  const base = await getBaseURL()
  const res = await fetch(`${base}/api/v1/organizations/slug/${encodeURIComponent(slug)}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}


export default async function OrgAdminPage(ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  // Compatibility shim: resolve slug to org UUID, then redirect to UUID-first route.
  const org = await fetchOrgBySlug(slug)
  redirect(`/${encodeURIComponent(org.uuid)}`)
}
