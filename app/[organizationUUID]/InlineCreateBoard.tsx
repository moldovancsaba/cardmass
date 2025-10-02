"use client"

import { useState } from 'react'
import { fetchWithOrg } from '@/lib/http/fetchWithOrg'

/**
 * InlineCreateBoard — small, reusable creator for org-scoped boards
 * What: Minimal form to create a board under a specific organization (by UUID)
 * Why: Enables /{organizationUUID}/creator and quick-create on org pages without refactoring the legacy slug-based CreatorApp.
 */
export default function InlineCreateBoard({ orgUUID, defaultSlug = '' }: { orgUUID: string; defaultSlug?: string }) {
  const [slug, setSlug] = useState(defaultSlug)
  const [rows, setRows] = useState(1)
  const [cols, setCols] = useState(1)
  const [background, setBackground] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onCreate() {
    const s = (slug || '').trim()
    const r = Math.max(1, Math.min(100, Number(rows) || 1))
    const c = Math.max(1, Math.min(100, Number(cols) || 1))
    const bg = String(background || '')
    setLoading(true)
    setError(null)
    try {
      type BoardCreated = { uuid: string }
      // IMPORTANT: X-Organization-UUID header is injected by fetchWithOrg.
      const created = await fetchWithOrg<BoardCreated>(
        `/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards`,
        orgUUID,
        {
          method: 'POST',
          body: JSON.stringify({ slug: s, rows: r, cols: c, areas: [], background: bg }),
        }
      )
      // Navigate to the hashed org/board route
      window.location.assign(`/${encodeURIComponent(orgUUID)}/${encodeURIComponent(created.uuid)}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create board')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-black/10 rounded p-3">
      <div className="text-sm font-medium mb-2">Create Board</div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs">slug (optional)</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="border border-black/20 rounded px-2 py-1"
            placeholder="e.g. impact"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs">rows</span>
          <input
            type="number"
            min={1}
            max={100}
            value={rows}
            onChange={(e) => setRows(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="border border-black/20 rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs">cols</span>
          <input
            type="number"
            min={1}
            max={100}
            value={cols}
            onChange={(e) => setCols(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="border border-black/20 rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 md:col-span-3">
          <span className="text-xs" title="Only background-* declarations are applied; other properties are ignored.">Board background (CSS)</span>
          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="border border-black/20 rounded px-2 py-1 font-mono text-[11px] min-h-[120px]"
            placeholder={`background-color: #2A7B9B; /* Fallback solid color */\nbackground-image: \n  url("https://example.com/your-background.jpg"), \n  linear-gradient(90deg, rgba(42, 123, 155, 1) 0%, rgba(87, 199, 133, 1) 50%, rgba(237, 221, 83, 1) 100%);\n\n/* Optional positioning/repeat */\nbackground-repeat: no-repeat, no-repeat;\nbackground-size: cover, cover;\nbackground-position: center, center;`}
          />
          <div className="text-[10px] text-gray-500">Only background-* declarations are applied; other CSS properties are ignored.</div>
        </label>
      </div>
      <div className="mt-3">
        <button
          onClick={onCreate}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-[--color-brand] text-white disabled:opacity-50"
        >{loading ? 'Creating…' : 'Create & open'}</button>
      </div>
    </div>
  )
}
