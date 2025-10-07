import SpockNav from "@/components/SpockNav";
import CreatorApp from "../../creator/ui/CreatorApp";
import { isUUIDv4 } from "@/lib/validation";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateAdminToken, checkOrgAccess } from "@/lib/auth";

/**
 * /[organizationUUID]/creator — org-scoped Creator (full grid)
 * What: Reuses the centralized Creator UI with org-scoped save logic (UUID-first).
 * Why: Authentication required to prevent unauthorized board creation
 */
export default async function OrganizationCreatorPage(ctx: { params: Promise<{ organizationUUID: string }> }) {
  const { organizationUUID: org } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org)) return notFound()
  
  // WHAT: Check authentication and org access
  // WHY: Only authenticated users with org access can create boards
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (!token) {
    redirect(`/?redirect=/${encodeURIComponent(org)}/creator`);
  }
  
  const user = await validateAdminToken(token);
  if (!user || !user._id) {
    redirect(`/?redirect=/${encodeURIComponent(org)}/creator`);
  }
  
  // WHAT: Verify user has access to this organization
  // WHY: Users should only create boards in orgs they belong to
  const orgRole = await checkOrgAccess(user._id.toString(), org);
  if (!orgRole) {
    // User doesn't have access - redirect to org selector
    redirect('/organizations');
  }

  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <header>
          <h1 className="text-2xl font-bold">Creator</h1>
          <p className="text-sm text-gray-600 mt-1">Design your board areas and save under this organization.</p>
        </header>

        <CreatorApp mode="org" orgUUID={org} />
      </section>
    </main>
  )
}
