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
// Authentication temporarily disabled

export default async function OrganizationMainPage(ctx: { params: Promise<{ organizationUUID: string }> }) {
  const { organizationUUID: org } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org)) return notFound()
  
  // WHAT: Authentication temporarily disabled for testing
  // WHY: Get app working without SSO to test deployment
  const orgRole = 'user' as const;

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
