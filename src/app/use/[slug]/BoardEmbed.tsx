"use client"

/**
 * FUNCTIONAL: Legacy placeholder for removed Board component.
 * STRATEGIC: Avoids build-time import error for '@/components/Board' after legacy Kanban removal.
 *            This surface is deprecated and retained only for backward compatibility.
 */
export default function BoardEmbed({ boardSlug }: { boardSlug: string }) {
  return (
    <div className="text-xs text-gray-500">
      Legacy Board component is no longer available for slug: <code className="font-mono">{boardSlug}</code>.
    </div>
  )
}
