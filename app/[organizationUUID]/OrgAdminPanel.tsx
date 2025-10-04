"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

type Org = { uuid: string; name: string; slug: string; description?: string; isActive?: boolean }

type BoardItem = { uuid: string; slug?: string; updatedAt?: string; version?: number }

export default function OrgAdminPanel({ org, initialBoards }: { org: Org; initialBoards: BoardItem[] }) {
  const [form, setForm] = useState<Org>({ ...org })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [boards, setBoards] = useState<BoardItem[]>(initialBoards || [])
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [renameValues, setRenameValues] = useState<Record<string, string>>({})
  
  // WHAT: Password modal state for displaying generated board passwords
  // WHY: MessMass-style page password generation UI
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordModalData, setPasswordModalData] = useState<{
    boardSlug: string
    password: string
    shareableLink: string
  } | null>(null)
  const [generatingPassword, setGeneratingPassword] = useState<Record<string, boolean>>({})

  async function loadBoards() {
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(org.uuid)}/boards`, {
        headers: { 'X-Organization-UUID': org.uuid },
        cache: 'no-store'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Load boards failed')
      setBoards(Array.isArray(data) ? data : [])
    } catch { /* no-op; keep current */ }
  }

  const pillStyle = useMemo(() => {
    const name = form.name || ''
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
    const h1 = Math.abs(hash) % 360
    const h2 = (h1 + 40) % 360
    const c1 = `hsl(${h1} 85% 85%)`
    const c2 = `hsl(${h2} 85% 75%)`
    return { background: `linear-gradient(135deg, ${c1}, ${c2})`, color: '#111' }
  }, [form.name])

  async function saveOrg() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(org.uuid)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Organization-UUID': org.uuid },
        body: JSON.stringify({ name: form.name, slug: form.slug, description: form.description || '', isActive: !!form.isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Save failed')
      setForm({ ...form, name: data.name, slug: data.slug, description: data.description, isActive: data.isActive })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function deleteOrg() {
    const ok = confirm(`Delete organization '${form.name}'? This will remove all boards and cards under it.`)
    if (!ok) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(org.uuid)}`, { method: 'DELETE', headers: { 'X-Organization-UUID': org.uuid } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Delete failed')
      window.location.assign('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally { setSaving(false) }
  }

  async function renameBoard(b: BoardItem) {
    const slug = (renameValues[b.uuid] || '').trim()
    if (!slug) return
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(org.uuid)}/boards/${encodeURIComponent(b.uuid)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Organization-UUID': org.uuid },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Rename failed')
      setBoards((prev) => prev.map((x) => x.uuid === b.uuid ? { ...x, slug: data.slug } : x))
      setEditing((prev) => ({ ...prev, [b.uuid]: false }))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Rename failed') }
  }

  async function deleteBoard(b: BoardItem) {
    const ok = confirm(`Delete board '${b.slug || b.uuid}'?`)
    if (!ok) return
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(org.uuid)}/boards/${encodeURIComponent(b.uuid)}`, {
        method: 'DELETE',
        headers: { 'X-Organization-UUID': org.uuid },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Delete failed')
      setBoards((prev) => prev.filter((x) => x.uuid !== b.uuid))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  /**
   * WHAT: Generate or regenerate page password for a board
   * WHY: MessMass-style password generation - shareable board access without requiring login
   * HOW: Calls POST /api/page-passwords with pageId=boardUUID, shows result in modal
   */
  async function generateBoardPassword(b: BoardItem, regenerate: boolean = false) {
    setGeneratingPassword((prev) => ({ ...prev, [b.uuid]: true }))
    try {
      const res = await fetch('/api/page-passwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pageId: b.uuid,
          pageType: 'tagger',
          organizationUUID: org.uuid,
          regenerate,
        }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to generate password')
      
      setPasswordModalData({
        boardSlug: b.slug || b.uuid.slice(0, 8),
        password: data.pagePassword.password,
        shareableLink: data.shareableLink.url,
      })
      setShowPasswordModal(true)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Password generation failed')
    } finally {
      setGeneratingPassword((prev) => ({ ...prev, [b.uuid]: false }))
    }
  }

  // Auto-refresh: on mount and on 'board:created' — attach once and cleanup properly
  const bcRef = useRef<BroadcastChannel | null>(null)
  useEffect(() => {
    let disposed = false
    // initial load
    loadBoards()
    // BroadcastChannel
    try {
      const bc = new BroadcastChannel('cardmass')
      bcRef.current = bc
      const onMsg = (ev: MessageEvent) => {
        try {
          if (!disposed && ev.data && (ev.data as { type?: string }).type === 'board:created') {
            loadBoards()
          }
        } catch {}
      }
      bc.addEventListener('message', onMsg)
      // CustomEvent fallback
      const onEvt = () => { if (!disposed) loadBoards() }
      window.addEventListener('board:created', onEvt)
      return () => {
        disposed = true
        try { bc.removeEventListener('message', onMsg); bc.close(); bcRef.current = null } catch {}
        try { window.removeEventListener('board:created', onEvt) } catch {}
      }
    } catch {
      // If BroadcastChannel unavailable, still attach CustomEvent listener
      const onEvt = () => { if (!disposed) loadBoards() }
      window.addEventListener('board:created', onEvt)
      return () => { disposed = true; try { window.removeEventListener('board:created', onEvt) } catch {} }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      {/* Organization settings */}
      <section className="border border-black/10 rounded p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-sm rounded-full shadow-sm" style={pillStyle}>{form.name || 'Organization'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveOrg}
              disabled={saving}
              className="px-4 py-1.5 text-sm rounded-full bg-sky-600 text-white hover:bg-sky-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >Save</button>
            <button
              onClick={deleteOrg}
              disabled={saving}
              className="px-4 py-1.5 text-sm rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >Delete</button>
          </div>
        </div>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs">Name</span>
            <input className="border border-black/20 rounded px-2 py-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs">Slug (metadata only)</span>
            <input className="border border-black/20 rounded px-2 py-1" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-xs">Description</span>
            <textarea className="border border-black/20 rounded px-2 py-1" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <span className="text-sm">Active</span>
          </label>
        </div>
      </section>

      {/* Boards CRUD */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Boards</h2>
        {boards.length === 0 ? (
          <div className="text-sm text-gray-500">No boards yet. Use Creator to add one.</div>
        ) : (
          <ul className="divide-y divide-black/10 border border-black/10 rounded">
            {boards.map((b) => (
              <li key={b.uuid} className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {!editing[b.uuid] ? (
                    <div>
                      <div className="font-medium">{b.slug || `board-${b.uuid.slice(0, 6)}`}</div>
                      {b.updatedAt && <div className="text-xs text-gray-500">updated {b.updatedAt}</div>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        className="border border-black/20 rounded px-2 py-1"
                        placeholder="new slug"
                        value={renameValues[b.uuid] ?? (b.slug || '')}
                        onChange={(e) => setRenameValues((prev) => ({ ...prev, [b.uuid]: e.target.value }))}
                      />
                      <button className="px-3 py-1 text-sm rounded-full bg-sky-600 text-white hover:bg-sky-700 transition-colors font-medium" onClick={() => renameBoard(b)}>Save</button>
                      <button className="px-3 py-1 text-sm rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setEditing((p) => ({ ...p, [b.uuid]: false }))}>Cancel</button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!editing[b.uuid] && (
                    <>
                      <a className="px-3 py-1 text-sm rounded-full bg-sky-600 !text-white hover:bg-sky-700 hover:!text-white transition-colors font-medium" href={`/${encodeURIComponent(org.uuid)}/${encodeURIComponent(b.uuid)}/tagger`}>Tagger</a>
                      <a className="px-3 py-1 text-sm rounded-full bg-sky-600 !text-white hover:bg-sky-700 hover:!text-white transition-colors font-medium" href={`/${encodeURIComponent(org.uuid)}/creator?board=${encodeURIComponent(b.uuid)}`}>Edit</a>
                      <button 
                        className="px-3 py-1 text-sm rounded-full bg-emerald-600 !text-white hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50" 
                        onClick={() => generateBoardPassword(b)} 
                        disabled={generatingPassword[b.uuid]}
                        title="Generate shareable password for this board"
                      >
                        {generatingPassword[b.uuid] ? '...' : '🔑 Password'}
                      </button>
                      <button className="px-3 py-1 text-sm rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setEditing((p) => ({ ...p, [b.uuid] : true }))}>Rename</button>
                      <button className="px-3 py-1 text-sm rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors" onClick={() => deleteBoard(b)}>Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Password Modal */}
      {showPasswordModal && passwordModalData && (
        <BoardPasswordModal
          boardSlug={passwordModalData.boardSlug}
          password={passwordModalData.password}
          shareableLink={passwordModalData.shareableLink}
          onClose={() => {
            setShowPasswordModal(false)
            setPasswordModalData(null)
          }}
          onRegenerate={() => {
            setShowPasswordModal(false)
            // Find the board and regenerate
            const board = boards.find(b => 
              passwordModalData.shareableLink.includes(b.uuid)
            )
            if (board) {
              generateBoardPassword(board, true)
            }
          }}
        />
      )}
    </div>
  )
}

/**
 * WHAT: Board password display modal
 * WHY: MessMass-style password sharing UI - shows password and shareable link with copy buttons
 */
function BoardPasswordModal({
  boardSlug,
  password,
  shareableLink,
  onClose,
  onRegenerate,
}: {
  boardSlug: string
  password: string
  shareableLink: string
  onClose: () => void
  onRegenerate: () => void
}) {
  const [copied, setCopied] = useState<'password' | 'link' | null>(null)

  function copyToClipboard(text: string, type: 'password' | 'link') {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Board Access Password</h3>
        <p className="text-sm text-gray-600 mb-4">
          Board: <span className="font-mono font-medium">{boardSlug}</span>
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <p className="text-sm text-yellow-800 mb-2">
            ⚠️ <strong>Important:</strong> Save this password - anyone with it can view this board without logging in.
          </p>
          <p className="text-xs text-yellow-700">
            Logged-in users will bypass the password automatically.
          </p>
        </div>

        <div className="space-y-4">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(password, 'password')}
                className="px-4 py-2 bg-sky-600 !text-white hover:bg-sky-700 rounded-md text-sm font-medium transition-colors"
              >
                {copied === 'password' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Shareable Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shareable Link (with password)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareableLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-xs"
              />
              <button
                onClick={() => copyToClipboard(shareableLink, 'link')}
                className="px-4 py-2 bg-sky-600 !text-white hover:bg-sky-700 rounded-md text-sm font-medium transition-colors"
              >
                {copied === 'link' ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This link includes the password as a URL parameter - recipients can access the board immediately
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onRegenerate}
            className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 hover:underline"
          >
            🔄 Regenerate Password
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
