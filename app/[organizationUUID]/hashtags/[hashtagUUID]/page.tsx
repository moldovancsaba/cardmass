/**
 * WHAT: Hashtag details page - authentication wrapper
 * WHY: Follows "server authenticates, client hydrates" pattern
 * PATTERN: Server component handles auth only, client component fetches data
 */

import { isUUIDv4 } from '@/lib/validation'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/unified-auth'
import HashtagDetailsClient from './HashtagDetailsClient'

export default async function HashtagPage(ctx: { params: Promise<{ organizationUUID: string; hashtagUUID: string }> }) {
  const { organizationUUID: org, hashtagUUID } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org)) {
    return notFound()
  }
  
  // WHAT: Check SSO authentication
  const cookieStore = await cookies();
  const ssoToken = cookieStore.get('sso_session')?.value;
  const user = await getAuthenticatedUser({ sso_session: ssoToken });
  
  if (!user) {
    redirect(`/?redirect=/${encodeURIComponent(org)}/hashtags/${encodeURIComponent(hashtagUUID)}`);
  }
  
  // WHAT: Pass only IDs to client component for data fetching
  // WHY: Prevents server-side fetch failures that caused settings page 404 bug
  return <HashtagDetailsClient orgUUID={org} hashtagUUID={hashtagUUID} />
}
