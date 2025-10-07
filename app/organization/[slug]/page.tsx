/**
 * WHAT: Organization slug redirect page - compatibility shim
 * WHY: Resolves old slug-based URLs to new UUID-based routes
 * PATTERN: Server component with graceful error handling
 */

import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'

async function getBaseURL(): Promise<string> {
  // WHAT: Determine base URL for API calls
  // WHY: Works across local/preview/production environments
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'
}

async function fetchOrgBySlug(slug: string): Promise<{ uuid: string } | null> {
  // WHAT: Fetch organization by slug from API
  // WHY: Need UUID to redirect to new route format
  try {
    const base = await getBaseURL()
    const res = await fetch(
      `${base}/api/v1/organizations/slug/${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    )
    
    if (!res.ok) return null
    
    return await res.json()
  } catch {
    // WHAT: Catch network/parse errors gracefully
    // WHY: Prevents 500 errors, returns 404 instead
    return null
  }
}

export default async function OrgAdminPage(ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  
  // WHAT: Compatibility shim - resolve slug to org UUID, then redirect to UUID-first route
  // WHY: Maintains backward compatibility with old slug-based URLs
  const org = await fetchOrgBySlug(slug)
  
  if (!org || !org.uuid) {
    // WHAT: Organization not found by slug
    // WHY: Return 404 instead of crashing with 500 error
    return notFound()
  }
  
  redirect(`/${encodeURIComponent(org.uuid)}`)
}
