"use client"

/**
 * WHAT: Tabbed interface for organization settings
 * WHY: Consolidates all admin functionality: org management, users, boards, passwords
 * TABS: 1) Organization Management 2) User Management 3) Board Management 4) Access Passwords
 */

import { useState, useEffect, useRef, useMemo } from 'react'

type Org = { uuid: string; name: string; slug: string; description?: string; isActive?: boolean }
type BoardItem = { uuid: string; slug?: string; updatedAt?: string; version?: number }

type TabId = 'org' | 'users' | 'boards' | 'passwords'

export default function OrgSettingsTabs({ 
  org, 
  initialBoards,
  userRole 
}: { 
  org: Org; 
  initialBoards: BoardItem[];
  userRole: 'super-admin' | 'org-admin' | 'member';
}) {
  const [activeTab, setActiveTab] = useState<TabId>('org')

  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'org', label: 'Organization', icon: '🏢' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'boards', label: 'Boards', icon: '📋' },
    { id: 'passwords', label: 'Passwords', icon: '🔑' },
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-4 px-6 text-center font-medium text-sm transition-colors
                ${activeTab === tab.id 
                  ? 'border-b-2 border-sky-600 text-sky-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'org' && <OrganizationTab org={org} />}
        {activeTab === 'users' && <UsersTab orgUUID={org.uuid} />}
        {activeTab === 'boards' && <BoardsTab orgUUID={org.uuid} initialBoards={initialBoards} />}
        {activeTab === 'passwords' && <PasswordsTab orgUUID={org.uuid} />}
      </div>
    </div>
  )
}

/**
 * TAB 1: Organization Management
 * WHAT: Edit organization details - name, slug, description, active status
 * WHY: Central place for organization configuration
 */
function OrganizationTab({ org }: { org: Org }) {
  const [form, setForm] = useState<Org>({ ...org })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    setSuccess(false)
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(org.uuid)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Organization-UUID': org.uuid },
        body: JSON.stringify({ 
          name: form.name, 
          slug: form.slug, 
          description: form.description || '', 
          isActive: !!form.isActive 
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Save failed')
      setForm({ ...form, name: data.name, slug: data.slug, description: data.description, isActive: data.isActive })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteOrg() {
    const ok = confirm(`Delete organization '${form.name}'? This will remove all boards and cards under it. This action cannot be undone.`)
    if (!ok) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(org.uuid)}`, { 
        method: 'DELETE', 
        headers: { 'X-Organization-UUID': org.uuid } 
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Delete failed')
      window.location.assign('/organizations')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Organization Details</h3>
          <span className="px-3 py-1 text-sm rounded-full shadow-sm" style={pillStyle}>
            {form.name || 'Organization'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveOrg}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : '💾 Save'}
          </button>
          <button
            onClick={deleteOrg}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">✓ Organization saved successfully</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Organization Name</span>
          <input 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            placeholder="My Organization"
          />
        </label>
        
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Slug <span className="text-xs text-gray-500">(metadata only)</span></span>
          <input 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent" 
            value={form.slug} 
            onChange={(e) => setForm({ ...form, slug: e.target.value })} 
            placeholder="my-org"
          />
        </label>
        
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent min-h-[100px]" 
            value={form.description || ''} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            placeholder="Describe your organization..."
          />
        </label>
        
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={!!form.isActive} 
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
            className="w-4 h-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>
    </div>
  )
}

/**
 * TAB 2: User Management
 * WHAT: Placeholder for user management functionality
 * WHY: Will contain user access controls in future iterations
 */
function UsersTab({ orgUUID }: { orgUUID: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">👥</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
      <p className="text-gray-600 mb-4">
        User management functionality coming soon.
      </p>
      <p className="text-sm text-gray-500">
        This will allow you to add, remove, and manage user access to this organization.
      </p>
    </div>
  )
}

/**
 * TAB 3: Board Management
 * WHAT: Manage boards - rename, delete
 * WHY: Central place for board administration
 */
function BoardsTab({ orgUUID, initialBoards }: { orgUUID: string; initialBoards: BoardItem[] }) {
  const [boards, setBoards] = useState<BoardItem[]>(initialBoards || [])
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [renameValues, setRenameValues] = useState<Record<string, string>>({})

  async function loadBoards() {
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards`, {
        headers: { 'X-Organization-UUID': orgUUID },
        cache: 'no-store'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Load boards failed')
      setBoards(Array.isArray(data) ? data : [])
    } catch { /* no-op; keep current */ }
  }

  async function renameBoard(b: BoardItem) {
    const slug = (renameValues[b.uuid] || '').trim()
    if (!slug) return
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards/${encodeURIComponent(b.uuid)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Organization-UUID': orgUUID },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Rename failed')
      setBoards((prev) => prev.map((x) => x.uuid === b.uuid ? { ...x, slug: data.slug } : x))
      setEditing((prev) => ({ ...prev, [b.uuid]: false }))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Rename failed')
    }
  }

  async function deleteBoard(b: BoardItem) {
    const ok = confirm(`Delete board '${b.slug || b.uuid}'? This will remove all cards in this board.`)
    if (!ok) return
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards/${encodeURIComponent(b.uuid)}`, {
        method: 'DELETE',
        headers: { 'X-Organization-UUID': orgUUID },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Delete failed')
      setBoards((prev) => prev.filter((x) => x.uuid !== b.uuid))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  // WHAT: Auto-refresh board list on mount and when boards are created
  // WHY: Keep UI synchronized across tabs and after creator operations
  const bcRef = useRef<BroadcastChannel | null>(null)
  useEffect(() => {
    let disposed = false
    loadBoards()
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
      const onEvt = () => { if (!disposed) loadBoards() }
      window.addEventListener('board:created', onEvt)
      return () => {
        disposed = true
        try { bc.removeEventListener('message', onMsg); bc.close(); bcRef.current = null } catch {}
        try { window.removeEventListener('board:created', onEvt) } catch {}
      }
    } catch {
      const onEvt = () => { if (!disposed) loadBoards() }
      window.addEventListener('board:created', onEvt)
      return () => { disposed = true; try { window.removeEventListener('board:created', onEvt) } catch {} }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Board Management</h3>
        <p className="text-sm text-gray-500">{boards.length} {boards.length === 1 ? 'board' : 'boards'}</p>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-2">No boards yet</p>
          <p className="text-sm text-gray-400">Use Creator to create your first board</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
          {boards.map((b) => (
            <li key={b.uuid} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {!editing[b.uuid] ? (
                  <div>
                    <div className="font-medium">{b.slug || `board-${b.uuid.slice(0, 6)}`}</div>
                    {b.updatedAt && <div className="text-xs text-gray-500">updated {b.updatedAt}</div>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="new slug"
                      value={renameValues[b.uuid] ?? (b.slug || '')}
                      onChange={(e) => setRenameValues((prev) => ({ ...prev, [b.uuid]: e.target.value }))}
                    />
                    <button 
                      className="px-4 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors font-medium" 
                      onClick={() => renameBoard(b)}
                    >
                      Save
                    </button>
                    <button 
                      className="px-4 py-2 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors" 
                      onClick={() => setEditing((p) => ({ ...p, [b.uuid]: false }))}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!editing[b.uuid] && (
                  <>
                    <button 
                      className="px-4 py-2 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors" 
                      onClick={() => setEditing((p) => ({ ...p, [b.uuid]: true }))}
                    >
                      ✏️ Rename
                    </button>
                    <button 
                      className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors" 
                      onClick={() => deleteBoard(b)}
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * TAB 4: Access Passwords (Page Passwords)
 * WHAT: Manage board access passwords for sharing
 * WHY: Central place to view and manage all page passwords
 */
function PasswordsTab({ orgUUID }: { orgUUID: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">🔑</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Passwords</h3>
      <p className="text-gray-600 mb-4">
        Password management coming soon.
      </p>
      <p className="text-sm text-gray-500">
        Generate and manage board access passwords from the Board List on the organization main page.
      </p>
    </div>
  )
}
