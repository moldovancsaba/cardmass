/**
 * WHAT: Card details page - authentication wrapper
 * WHY: Follows "server authenticates, client hydrates" pattern
 * PATTERN: Server component handles auth only, client component fetches data
 */

import { isUUIDv4 } from '@/lib/validation'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { validateAdminToken, checkOrgAccess } from '@/lib/auth'
import CardDetailsClient from './CardDetailsClient'

export default async function CardDetailsPage(ctx: { params: Promise<{ organizationUUID: string; cardUUID: string }> }) {
  const { organizationUUID: org, cardUUID } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org) || !isUUIDv4(cardUUID)) {
    return notFound()
  }
  
  // WHAT: Check authentication and org access
  // WHY: Only authenticated users with org access can view cards
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (!token) {
    redirect(`/?redirect=/${encodeURIComponent(org)}/cards/${encodeURIComponent(cardUUID)}`);
  }
  
  const user = await validateAdminToken(token);
  if (!user || !user._id) {
    redirect(`/?redirect=/${encodeURIComponent(org)}/cards/${encodeURIComponent(cardUUID)}`);
  }
  
  // WHAT: Verify user has access to this organization
  // WHY: Users should only view cards in orgs they belong to
  const orgRole = await checkOrgAccess(user._id.toString(), org);
  if (!orgRole) {
    // User doesn't have access - redirect to org selector
    redirect('/organizations');
  }
  
  // WHAT: Pass only IDs to client component for data fetching
  // WHY: Prevents server-side fetch failures that caused settings page 404 bug
  return <CardDetailsClient orgUUID={org} cardUUID={cardUUID} />
}

