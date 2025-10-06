import { isUUIDv4 } from "@/lib/validation";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { validateAdminToken, checkOrgAccess } from "@/lib/auth";
import { fetchWithOrg } from "@/lib/http/fetchWithOrg";
import OrgSettingsTabs from "./OrgSettingsTabs";

/**
 * WHAT: Organization Settings page - all admin functionality in one place
 * WHY: Separates organization management from viewing, provides comprehensive admin controls
 * FLOW: Tabs for Organization Management, User Management, Board Management, Access Passwords
 */
export default async function OrganizationSettingsPage(ctx: { params: Promise<{ organizationUUID: string }> }) {
  const { organizationUUID: org } = await ctx.params
  if (!isUUIDv4(org)) return notFound()
  
  // WHAT: Check authentication and org access
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (!token) {
    redirect(`/?redirect=/${encodeURIComponent(org)}/settings`);
  }
  
  const user = await validateAdminToken(token);
  if (!user || !user._id) {
    redirect(`/?redirect=/${encodeURIComponent(org)}/settings`);
  }
  
  // WHAT: Verify user has admin access to this organization
  const orgRole = await checkOrgAccess(user._id.toString(), org);
  if (!orgRole || (orgRole !== 'org-admin' && orgRole !== 'super-admin')) {
    // User doesn't have admin access - redirect to org main page
    redirect(`/${encodeURIComponent(org)}`);
  }

  type Org = { uuid: string; name: string; slug: string; description?: string; isActive?: boolean }
  type BoardItem = { uuid: string; slug?: string; updatedAt?: string; version?: number }

  let orgData: Org | null = null
  let boards: BoardItem[] = []

  // Fetch organization data
  // WHAT: Use absolute URL for server-side fetch
  // WHY: Server components need full URL, not relative paths
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000')
  try {
    const res = await fetch(`${baseUrl}/api/v1/organizations/${encodeURIComponent(org)}`, { cache: 'no-store' })
    if (res.ok) orgData = await res.json()
  } catch (err) {
    console.error('Failed to fetch org data:', err)
  }
  
  // Fetch boards
  try {
    boards = await fetchWithOrg<BoardItem[]>(`/api/v1/organizations/${encodeURIComponent(org)}/boards`, org, { cache: 'no-store' })
  } catch {}

  if (!orgData) {
    return notFound()
  }

  return (
    <main className="min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
              <p className="text-sm text-gray-600 mt-1">
                {orgData.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                className="px-4 py-2 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                href={`/${encodeURIComponent(org)}`}
              >
                ← Back to Organization
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrgSettingsTabs 
          org={orgData} 
          initialBoards={boards} 
          userRole={orgRole}
        />
      </section>
    </main>
  )
}
