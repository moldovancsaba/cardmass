/**
 * WHAT: Card details page - authentication wrapper
 * WHY: Follows "server authenticates, client hydrates" pattern
 * PATTERN: Server component handles auth only, client component fetches data
 */

import { isUUIDv4 } from '@/lib/validation'
import { notFound } from 'next/navigation'
// Authentication temporarily disabled
import CardDetailsClient from './CardDetailsClient'

export default async function CardDetailsPage(ctx: { params: Promise<{ organizationUUID: string; cardUUID: string }> }) {
  const { organizationUUID: org, cardUUID } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org) || !isUUIDv4(cardUUID)) {
    return notFound()
  }
  
  // WHAT: Authentication temporarily disabled for testing
  
  // WHAT: Pass only IDs to client component for data fetching
  // WHY: Prevents server-side fetch failures that caused settings page 404 bug
  return <CardDetailsClient orgUUID={org} cardUUID={cardUUID} />
}

