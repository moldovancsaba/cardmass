"use client"

/**
 * WHAT: Simplified board list for organization main page
 * WHY: Separates board viewing from organization management
 * FLOW: Shows boards with Tagger/Edit links, password generation for sharing
 */

import { useEffect, useRef, useState } from 'react'

type BoardItem = { uuid: string; slug?: string; updatedAt?: string; version?: number }

export default function OrgBoardList({ orgUUID, initialBoards }: { orgUUID: string; initialBoards: BoardItem[] }) {
  const [boards, setBoards] = useState<BoardItem[]>(initialBoards || [])
  
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
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards`, {
        headers: { 'X-Organization-UUID': orgUUID },
        cache: 'no-store'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Load boards failed')
      setBoards(Array.isArray(data) ? data : [])
    } catch { /* no-op; keep current */ }
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
          organizationUUID: orgUUID,
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

  // WHAT: Auto-refresh board list on mount and when boards are created
  // WHY: Keep UI synchronized across tabs and after creator operations
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Boards</h2>
        <p className="text-sm text-gray-500">{boards.length} {boards.length === 1 ? 'board' : 'boards'}</p>
      </div>
      
      {boards.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-2">No boards yet</p>
          <p className="text-sm text-gray-400">Use Creator to create your first board</p>
        </div>
      ) : (
        <ul className="divide-y divide-black/10 border border-black/10 rounded overflow-hidden">
          {boards.map((b) => (
            <li key={b.uuid} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium text-lg">{b.slug || `board-${b.uuid.slice(0, 6)}`}</div>
                  {b.updatedAt && <div className="text-xs text-gray-500">updated {b.updatedAt}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  className="px-4 py-2 text-sm rounded-full bg-sky-600 !text-white hover:bg-sky-700 hover:!text-white transition-colors font-medium" 
                  href={`/${encodeURIComponent(orgUUID)}/${encodeURIComponent(b.uuid)}/tagger`}
                >
                  📋 Tagger
                </a>
                <a 
                  className="px-4 py-2 text-sm rounded-full bg-indigo-600 !text-white hover:bg-indigo-700 hover:!text-white transition-colors font-medium" 
                  href={`/${encodeURIComponent(orgUUID)}/settings`}
                >
                  ✏️ Edit
                </a>
                <button 
                  className="px-4 py-2 text-sm rounded-full bg-emerald-600 !text-white hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50" 
                  onClick={() => generateBoardPassword(b)} 
                  disabled={generatingPassword[b.uuid]}
                  title="Generate shareable password for this board"
                >
                  {generatingPassword[b.uuid] ? '...' : '🔑 Password'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

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
