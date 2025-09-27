import { isUUIDv4 } from "@/lib/validation";
import { notFound, redirect } from "next/navigation";

/**
 * /[organizationUUID]/admin — canonical route is /[organizationUUID]
 * Why: Admin UI now lives on the org UUID page. This route is kept as a redirect for compatibility.
 */
export default async function OrganizationAdminPage(ctx: { params: Promise<{ organizationUUID: string }> }) {
  const { organizationUUID: org } = await ctx.params
  if (!isUUIDv4(org)) return notFound()
  redirect(`/${encodeURIComponent(org)}`)
}
