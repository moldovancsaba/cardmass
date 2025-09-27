import SpockNav from "@/components/SpockNav";
import CreatorApp from "../../creator/ui/CreatorApp";
import { isUUIDv4 } from "@/lib/validation";
import { notFound } from "next/navigation";

/**
 * /[organizationUUID]/creator — org-scoped Creator (full grid)
 * What: Reuses the centralized Creator UI with org-scoped save logic (UUID-first).
 */
export default async function OrganizationCreatorPage(ctx: { params: Promise<{ organizationUUID: string }> }) {
  const { organizationUUID: org } = await ctx.params
  if (!isUUIDv4(org)) return notFound()

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
