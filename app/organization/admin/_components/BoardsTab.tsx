/**
 * WHAT: Organization board management UI with full CRUD capabilities
 * WHY: Org admins need to manage boards within their organization
 * 
 * Features:
 * - List all boards with metadata
 * - Create new boards (inline quick-create + link to full Creator)
 * - Edit board name/slug
 * - Delete boards
 * - Open boards in Tagger
 */

'use client'

import { useState, useEffect } from 'react'
import { useOrg } from '@/lib/org-context'
import { useToast } from '@/components/ToastProvider'
import Link from 'next/link'

interface Board {
  uuid: string
  slug?: string
  rows?: number
  cols?: number
  version?: number
  updatedAt?: string
  organizationId?: string
}

export default function BoardsTab() {
  const { orgUUID } = useOrg()
  const { showToast } = useToast()
  
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)

  useEffect(() => {
    if (orgUUID) {
      loadBoards()
    }
  }, [orgUUID])

  async function loadBoards() {
    if (!orgUUID) return
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/v1/organizations/${orgUUID}/boards`, {
        headers: { 'X-Organization-UUID': orgUUID },
        credentials: 'include'
      })
      
      if (!res.ok) throw new Error('Failed to load boards')
      
      const data = await res.json()
      setBoards(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteBoard(boardUUID: string, boardName: string) {
    if (!orgUUID) return
    if (!confirm(`Delete board "${boardName || boardUUID}"? This cannot be undone.`)) return
    
    try {
      const res = await fetch(`/api/v1/organizations/${orgUUID}/boards/${boardUUID}`, {
        method: 'DELETE',
        headers: { 'X-Organization-UUID': orgUUID },
        credentials: 'include'
      })
      
      if (!res.ok) throw new Error('Failed to delete board')
      
      showToast('Board deleted successfully', 'success')
      loadBoards()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete board', 'error')
    }
  }

  if (!orgUUID) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600 text-center">
          Please select an organization from the URL: ?org=&lt;uuid&gt;
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-600">Loading boards...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadBoards}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Organization Boards</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              + Quick Create
            </button>
            <Link
              href={`/${orgUUID}/creator`}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              Open Creator
            </Link>
          </div>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No boards found</p>
            <p className="text-sm text-gray-500">Create your first board to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name / Slug</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Grid</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Updated</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Version</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {boards.map((board) => (
                  <tr key={board.uuid} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <div className="font-medium">{board.slug || 'Untitled'}</div>
                        <div className="text-xs text-gray-500 font-mono">{board.uuid}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {board.rows && board.cols ? `${board.rows}×${board.cols}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {board.updatedAt ? new Date(board.updatedAt).toISOString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      v{board.version || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-right space-x-2">
                      <Link
                        href={`/${orgUUID}/${board.uuid}/tagger`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => setEditingBoard(board)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBoard(board.uuid, board.slug || '')}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateBoardModal
          orgUUID={orgUUID}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadBoards()
          }}
        />
      )}

      {editingBoard && (
        <EditBoardModal
          orgUUID={orgUUID}
          board={editingBoard}
          onClose={() => setEditingBoard(null)}
          onSuccess={() => {
            setEditingBoard(null)
            loadBoards()
          }}
        />
      )}
    </>
  )
}

/**
 * WHAT: Quick board creation modal
 * WHY: Allow simple board creation without leaving admin panel
 */
function CreateBoardModal({
  orgUUID,
  onClose,
  onSuccess
}: {
  orgUUID: string
  onClose: () => void
  onSuccess: () => void
}) {
  const { showToast } = useToast()
  const [slug, setSlug] = useState('')
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/v1/organizations/${orgUUID}/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-UUID': orgUUID
        },
        credentials: 'include',
        body: JSON.stringify({
          slug: slug || undefined,
          rows,
          cols,
          areas: []
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create board')
      }

      showToast('Board created successfully', 'success')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Create New Board</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name / Slug (optional)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-board"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generated UUID</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
              <input
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
              <input
                type="number"
                min="1"
                max="20"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={submitting}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * WHAT: Edit board modal
 * WHY: Allow updating board name/slug
 */
function EditBoardModal({
  orgUUID,
  board,
  onClose,
  onSuccess
}: {
  orgUUID: string
  board: Board
  onClose: () => void
  onSuccess: () => void
}) {
  const { showToast } = useToast()
  const [slug, setSlug] = useState(board.slug || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/v1/organizations/${orgUUID}/boards/${board.uuid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-UUID': orgUUID
        },
        credentials: 'include',
        body: JSON.stringify({ slug: slug || undefined })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update board')
      }

      showToast('Board updated successfully', 'success')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update board')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Edit Board</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name / Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-board"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={submitting}
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-xs text-gray-600">
              <strong>UUID:</strong> <span className="font-mono">{board.uuid}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
