/**
 * WHAT: Hashtag details page - authentication wrapper
 * WHY: Follows "server authenticates, client hydrates" pattern
 * PATTERN: Server component handles auth only, client component fetches data
 */

import { isUUIDv4 } from '@/lib/validation'
import { notFound } from 'next/navigation'
// Authentication temporarily disabled
import HashtagDetailsClient from './HashtagDetailsClient'

export default async function HashtagPage(ctx: { params: Promise<{ organizationUUID: string; hashtagUUID: string }> }) {
  const { organizationUUID: org, hashtagUUID } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org)) {
    return notFound()
  }
  
  // WHAT: Authentication temporarily disabled for testing
  
  // WHAT: Pass only IDs to client component for data fetching
  // WHY: Prevents server-side fetch failures that caused settings page 404 bug
  return <HashtagDetailsClient orgUUID={org} hashtagUUID={hashtagUUID} />
}
