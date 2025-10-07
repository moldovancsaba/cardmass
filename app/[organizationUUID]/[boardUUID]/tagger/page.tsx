/**
 * WHAT: Tagger page - authentication wrapper
 * WHY: Follows "server authenticates, client hydrates" pattern
 * PATTERN: Server component handles auth only, client component fetches board data
 * NOTE: This page has optional auth - authenticated users need org access,
 *       unauthenticated users can access via PasswordGate
 */

import { isUUIDv4 } from '@/lib/validation'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { validateAdminToken, checkOrgAccess } from '@/lib/auth'
import TaggerWithAuth from './TaggerWithAuth'

export default async function TaggerPage(ctx: { params: Promise<{ organizationUUID: string, boardUUID: string }> }) {
  const { organizationUUID: org, boardUUID: boardId } = await ctx.params
  
  // WHAT: Validate URL format before any auth checks
  // WHY: Invalid UUIDs should 404 immediately
  if (!isUUIDv4(org) || !isUUIDv4(boardId)) {
    return notFound()
  }
  
  // WHAT: Check authentication and org access (in addition to PasswordGate)
  // WHY: Authenticated users must have org access to view boards
  // NOTE: If no token, PasswordGate will handle auth prompt
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (token) {
    const user = await validateAdminToken(token);
    if (user && user._id) {
      const orgRole = await checkOrgAccess(user._id.toString(), org);
      if (!orgRole) {
        // WHAT: User is authenticated but doesn't have access to this org
        // WHY: Redirect to org selector to choose accessible org
        redirect('/organizations');
      }
    }
  }

  // WHAT: Pass only IDs to client component for data fetching
  // WHY: Prevents server-side fetch failures that caused settings page 404 bug
  // NOTE: TaggerWithAuth will fetch board data (rows, cols, areas, background)
  return (
    <main className="min-h-screen">
      <TaggerWithAuth orgUUID={org} boardUUID={boardId} />
    </main>
  )
}
