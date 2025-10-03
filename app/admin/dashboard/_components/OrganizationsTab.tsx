/**
 * WHAT: Organization CRUD management interface
 * WHY: Super-admins need to manage all organizations in the system
 * 
 * Features:
 * - List all organizations with metadata
 * - Create new organizations
 * - Edit organization details (name, slug, description)
 * - Toggle active status
 * - Delete organizations
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'

interface Organization {
  uuid: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function OrganizationsTab() {
  const { showToast } = useToast()
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)

  /**
   * WHAT: Memoize loadOrganizations so its identity is stable across renders
   * WHY: Allows useEffect to safely depend on loadOrganizations, satisfying react-hooks/exhaustive-deps
   */
  const loadOrganizations = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/v1/organizations', {
        credentials: 'include'
      })
      
      if (!res.ok) throw new Error('Failed to load organizations')
      
      const data = await res.json()
      setOrganizations(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  async function handleDeleteOrg(uuid: string, name: string) {
    if (!confirm(`Delete organization "${name}"? This will remove all associated boards and cards. This cannot be undone.`)) return
    
    try {
      const res = await fetch(`/api/v1/organizations/${uuid}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!res.ok) throw new Error('Failed to delete organization')
      
      showToast('Organization deleted successfully', 'success')
      loadOrganizations()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete organization', 'error')
    }
  }

  async function handleToggleActive(uuid: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/v1/organizations/${uuid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus })
      })
      
      if (!res.ok) throw new Error('Failed to update organization')
      
      showToast(`Organization ${!currentStatus ? 'activated' : 'deactivated'}`, 'success')
      loadOrganizations()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update organization', 'error')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-600">Loading organizations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadOrganizations}
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
          <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            + Create Organization
          </button>
        </div>

        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No organizations found</p>
            <p className="text-sm text-gray-500">Create your first organization to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Slug</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Created</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.uuid} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <div className="font-medium">{org.name}</div>
                        {org.description && (
                          <div className="text-xs text-gray-500">{org.description}</div>
                        )}
                        <div className="text-xs text-gray-400 font-mono mt-1">{org.uuid}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{org.slug}</code>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <button
                        onClick={() => handleToggleActive(org.uuid, org.isActive)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          org.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {org.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(org.createdAt).toISOString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => window.open(`/${org.uuid}`, '_blank')}
                        className="text-indigo-600 hover:text-indigo-800 text-xs"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => setEditingOrg(org)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOrg(org.uuid, org.name)}
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
        <CreateOrgModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadOrganizations()
          }}
        />
      )}

      {editingOrg && (
        <EditOrgModal
          organization={editingOrg}
          onClose={() => setEditingOrg(null)}
          onSuccess={() => {
            setEditingOrg(null)
            loadOrganizations()
          }}
        />
      )}
    </>
  )
}

/**
 * WHAT: Organization creation modal
 * WHY: Allow creating new organizations with name, slug, and description
 */
function CreateOrgModal({
  onClose,
  onSuccess
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/v1/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to create organization')
      }

      showToast('Organization created successfully', 'success')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Create New Organization</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="acme-corp"
              pattern="[a-z0-9-]+"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              required
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              disabled={submitting}
            />
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
              {submitting ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * WHAT: Organization edit modal
 * WHY: Allow updating organization name, slug, and description
 */
function EditOrgModal({
  organization,
  onClose,
  onSuccess
}: {
  organization: Organization
  onClose: () => void
  onSuccess: () => void
}) {
  const { showToast } = useToast()
  const [name, setName] = useState(organization.name)
  const [slug, setSlug] = useState(organization.slug)
  const [description, setDescription] = useState(organization.description || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/v1/organizations/${organization.uuid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to update organization')
      }

      showToast('Organization updated successfully', 'success')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Edit Organization</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              pattern="[a-z0-9-]+"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-xs text-gray-600">
              <strong>UUID:</strong> <span className="font-mono">{organization.uuid}</span>
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
