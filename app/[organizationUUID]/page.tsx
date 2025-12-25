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
import { getAuthenticatedUser } from "@/lib/unified-auth";

export default async function OrganizationMainPage(ctx: { params: Promise<{ organizationUUID: string }> }) {
  const { organizationUUID: org } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org)) return notFound()
  
  // WHAT: Check SSO authentication
  const cookieStore = await cookies();
  const ssoToken = cookieStore.get('sso_session')?.value;
  const user = await getAuthenticatedUser({ sso_session: ssoToken });
  
  if (!user) {
    redirect(`/?redirect=/${encodeURIComponent(org)}`);
  }
  
  // WHAT: With SSO, all authenticated users can access all orgs
  // WHY: App-level permissions grant access; role determines capabilities
  const orgRole = user.role;

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
