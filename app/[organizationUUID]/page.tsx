/**
 * WHAT: Organization main page - authentication wrapper
 * WHY: Follows "server authenticates, client hydrates" pattern
 * PATTERN: Server component handles auth only, client components fetch data
 */

import SpockNav from "@/components/SpockNav";
import OrgBoardList from "./OrgBoardList";
import OrgHeader from "./OrgHeader";
import { isUUIDv4 } from "@/lib/validation";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateAdminToken, checkOrgAccess } from "@/lib/auth";

export default async function OrganizationMainPage(ctx: { params: Promise<{ organizationUUID: string }> }) {
  const { organizationUUID: org } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org)) return notFound()
  
  // WHAT: Check authentication and org access
  // WHY: Only authenticated users with org access can view organization
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (!token) {
    redirect(`/?redirect=/${encodeURIComponent(org)}`);
  }
  
  const user = await validateAdminToken(token);
  if (!user || !user._id) {
    redirect(`/?redirect=/${encodeURIComponent(org)}`);
  }
  
  // WHAT: Verify user has access to this organization
  // WHY: Users should only view orgs they belong to
  const orgRole = await checkOrgAccess(user._id.toString(), org);
  if (!orgRole) {
    // User doesn't have access - redirect to org selector
    redirect('/organizations');
  }

  // WHAT: Pass only IDs and role to client components for data fetching
  // WHY: Prevents server-side fetch failures that caused settings page 404 bug
  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* WHAT: Header with org name display and action buttons */}
        {/* WHY: Client component fetches org name, shows loading state */}
        <OrgHeader orgUUID={org} userRole={orgRole} />

        {/* WHAT: Board list with auto-refresh functionality */}
        {/* WHY: Client component handles board data fetching and updates */}
        <OrgBoardList orgUUID={org} initialBoards={[]} />
      </section>
    </main>
  )
}
