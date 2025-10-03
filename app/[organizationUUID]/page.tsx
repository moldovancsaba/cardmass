import SpockNav from "@/components/SpockNav";
import OrgAdminPanel from "./OrgAdminPanel";
import { isUUIDv4 } from "@/lib/validation";
import { fetchWithOrg } from "@/lib/http/fetchWithOrg";
import { notFound, redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import Link from "next/link";
import { validateAdminToken, checkOrgAccess } from "@/lib/auth";

/**
 * /[organizationUUID] — organization main page
 * What: Shows organization details and lists its boards; quick access to Creator and Admin.
 * Why: Provides a first-class org-scoped landing aligned with hashed board routing and header-enforced APIs.
 */
export default async function OrganizationMainPage(ctx: { params: Promise<{ organizationUUID: string }> }) {
  const { organizationUUID: org } = await ctx.params
  if (!isUUIDv4(org)) return notFound()
  
  // WHAT: Check authentication and org access
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (!token) {
    redirect(`/admin/login?redirect=/${encodeURIComponent(org)}`);
  }
  
  const user = await validateAdminToken(token);
  if (!user || !user._id) {
    redirect(`/admin/login?redirect=/${encodeURIComponent(org)}`);
  }
  
  // WHAT: Verify user has access to this organization
  const orgRole = await checkOrgAccess(user._id.toString(), org);
  if (!orgRole) {
    // User doesn't have access - redirect to org selector
    redirect('/organizations');
  }

  type Org = { uuid: string; name: string; slug: string; description?: string }
  type BoardItem = { uuid: string; slug?: string; updatedAt?: string; version?: number }

  let orgData: Org | null = null
  let boards: BoardItem[] = []

  // Use absolute base URL for reliability in server components (mirrors slug-admin pattern)
  async function getBaseURL(): Promise<string> {
    const h = await headers()
    const proto = h.get('x-forwarded-proto') ?? 'http'
    const host = h.get('x-forwarded-host') ?? h.get('host')
    if (host) return `${proto}://${host}`
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'
  }

  try {
    const base = await getBaseURL()
    const res = await fetch(`${base}/api/v1/organizations/${encodeURIComponent(org)}`, { cache: 'no-store' })
    if (res.ok) orgData = await res.json()
  } catch {}
  try {
    boards = await fetchWithOrg<BoardItem[]>(`/api/v1/organizations/${encodeURIComponent(org)}/boards`, org, { cache: 'no-store' })
  } catch {}

  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Organization</h1>
            {orgData && (
              // Styled pill for organization name — curved background inspired by narimato
              <span
                className="px-2 py-0.5 text-sm rounded-full shadow-sm"
                style={(() => {
                  const name = orgData?.name || ''
                  // Derive a stable gradient from organization name (hash -> hues)
                  let hash = 0
                  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
                  const h1 = Math.abs(hash) % 360
                  const h2 = (h1 + 40) % 360
                  const c1 = `hsl(${h1} 85% 85%)`
                  const c2 = `hsl(${h2} 85% 75%)`
                  return { background: `linear-gradient(135deg, ${c1}, ${c2})`, color: '#111' }
                })()}
                title={orgData.name}
              >
                {orgData.name}
              </span>
            )}
          </div>

          {/* Primary actions: org-scoped Creator & Admin (if authorized) */}
          <div className="flex items-center gap-2">
            <Link
              className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-indigo-100 to-indigo-200 text-black border border-black/10 hover:from-indigo-200 hover:to-indigo-300"
              href={`/${encodeURIComponent(org)}/creator`}
            >
              Creator
            </Link>
            {(orgRole === 'org-admin' || orgRole === 'super-admin') && (
              <Link
                className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-purple-100 to-purple-200 text-black border border-black/10 hover:from-purple-200 hover:to-purple-300"
                href={`/organization/admin?org=${encodeURIComponent(org)}`}
              >
                Admin Panel
              </Link>
            )}
            <Link
              className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-black border border-black/10 hover:from-gray-200 hover:to-gray-300"
              href="/organizations"
            >
              ← Back to Orgs
            </Link>
          </div>
        </header>

        {/* Creator lives at /{orgUUID}/creator; no inline board creation here. */}
        <OrgAdminPanel org={{ uuid: org, name: orgData?.name || '', slug: orgData?.slug || '', description: orgData?.description || '', isActive: true }} initialBoards={boards} />
      </section>
    </main>
  )
}
