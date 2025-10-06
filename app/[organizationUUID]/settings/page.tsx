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

  // WHAT: Fetch boards data for the settings tabs
  // WHY: Organization data will be fetched by the client component tabs
  type BoardItem = { uuid: string; slug?: string; updatedAt?: string; version?: number }
  let boards: BoardItem[] = []
  
  // Fetch boards (non-critical, tabs will handle empty state)
  try {
    boards = await fetchWithOrg<BoardItem[]>(`/api/v1/organizations/${encodeURIComponent(org)}/boards`, org, { cache: 'no-store' })
  } catch {
    // Boards fetch failure is non-fatal - tabs will show empty state
  }

  // WHAT: Create a minimal org object with the UUID we already have
  // WHY: The tabs component will fetch full org details from the API
  const orgData = {
    uuid: org,
    name: '',  // Will be loaded by tabs component
    slug: '',
    description: undefined,
    isActive: true
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
                Loading...
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
