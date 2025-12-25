import SpockNav from "@/components/SpockNav";
import CreatorApp from "../../creator/ui/CreatorApp";
import { isUUIDv4 } from "@/lib/validation";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthenticatedUser } from "@/lib/unified-auth";

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
  
  // WHAT: Check SSO authentication
  const cookieStore = await cookies();
  const ssoToken = cookieStore.get('sso_session')?.value;
  const user = await getAuthenticatedUser({ sso_session: ssoToken });
  
  if (!user) {
    redirect(`/?redirect=/${encodeURIComponent(org)}/creator`);
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
