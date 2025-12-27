/**
 * WHAT: Tagger page - authentication wrapper
 * WHY: Follows "server authenticates, client hydrates" pattern
 * PATTERN: Server component handles auth only, client component fetches board data
 * NOTE: This page has optional auth - authenticated users need org access,
 *       unauthenticated users can access via PasswordGate
 */

import { isUUIDv4 } from '@/lib/validation'
import { notFound } from 'next/navigation'
// Authentication temporarily disabled
import TaggerWithAuth from './TaggerWithAuth'

export default async function TaggerPage(ctx: { params: Promise<{ organizationUUID: string, boardUUID: string }> }) {
  const { organizationUUID: org, boardUUID: boardId } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org) || !isUUIDv4(boardId)) {
    return notFound()
  }
  
  // WHAT: Authentication temporarily disabled - PasswordGate will handle access

  // WHAT: Pass only IDs to client component for data fetching
  // WHY: Prevents server-side fetch failures that caused settings page 404 bug
  // NOTE: TaggerWithAuth will fetch board data (rows, cols, areas, background)
  return (
    <main className="min-h-screen">
      <TaggerWithAuth orgUUID={org} boardUUID={boardId} />
    </main>
  )
}
