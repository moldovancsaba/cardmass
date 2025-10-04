/**
 * WHAT: System-level user management interface
 * WHY: Super-admins need to manage all users and super-admins in the system
 * 
 * Features:
 * - List all system users with role display
 * - Create new users/super-admins with auto-generated passwords
 * - Change user roles (user ↔ super-admin)
 * - Regenerate passwords
 * - Delete users (with last super-admin guard)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'

interface SystemUser {
  _id: string
  email: string
  name: string
  role: 'user' | 'super-admin'
  createdAt?: string
  updatedAt?: string
}

/**
 * WHAT: Generate secure random password
 * WHY: Create strong passwords for new users; 32-hex token convention
 */
function generatePassword(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export default function SystemUsersTab() {
  const { showToast } = useToast()
  
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [regeneratedPassword, setRegeneratedPassword] = useState('')

  /**
   * WHAT: Memoize loadUsers so its identity is stable across renders
   * WHY: Allows useEffect to safely depend on loadUsers, satisfying react-hooks/exhaustive-deps
   */
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/admin/users', {
        credentials: 'include'
      })
      
      if (!res.ok) throw new Error('Failed to load users')
      
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function handleRoleChange(userId: string, newRole: 'user' | 'super-admin') {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role: newRole })
      })
      
      if (!res.ok) throw new Error('Failed to update role')
      
      showToast('Role updated successfully', 'success')
      loadUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update role', 'error')
    }
  }

  async function handleDeleteUser(userId: string, userEmail: string) {
    if (!confirm(`Delete user ${userEmail}?`)) return
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (res.status === 403) {
        const data = await res.json()
        showToast(data.error || 'Cannot delete user', 'error')
        return
      }
      
      if (!res.ok) throw new Error('Failed to delete user')
      
      showToast('User deleted successfully', 'success')
      loadUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete user', 'error')
    }
  }

  async function handleRegeneratePassword(userId: string, userEmail: string) {
    if (!confirm(`Regenerate password for ${userEmail}?`)) return
    
    const newPassword = generatePassword()
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, password: newPassword })
      })
      
      if (!res.ok) throw new Error('Failed to regenerate password')
      
      setRegeneratedPassword(newPassword)
      setShowPasswordModal(true)
      showToast('Password regenerated', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to regenerate password', 'error')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-600">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm disabled:opacity-50"
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Users</h2>
            <p className="text-sm text-gray-600 mt-1">
              {users.filter(u => u.role === 'super-admin').length} super-admin(s), {users.filter(u => u.role === 'user').length} user(s)
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm disabled:opacity-50"
          >
            + Add User
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-center py-8 text-gray-600">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Created</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4 text-sm">{user.name}</td>
                    <td className="py-3 px-4 text-sm">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value as 'user' | 'super-admin')}
                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="user">User</option>
                        <option value="super-admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toISOString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => handleRegeneratePassword(user._id, user.email)}
                        className="text-sky-600 hover:text-sky-800 hover:underline text-xs"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id, user.email)}
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

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            loadUsers()
          }}
        />
      )}

      {showPasswordModal && (
        <PasswordModal
          password={regeneratedPassword}
          onClose={() => {
            setShowPasswordModal(false)
            setRegeneratedPassword('')
          }}
        />
      )}
    </>
  )
}

/**
 * WHAT: Add User modal with auto-generated password
 * WHY: Secure user creation with copy-to-clipboard password feature
 */
function AddUserModal({
  onClose,
  onSuccess
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'user' | 'super-admin'>('user')
  const [password, setPassword] = useState(() => generatePassword())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, name, role, password })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create user')
      }

      showToast('User created successfully', 'success')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(password)
    showToast('Password copied to clipboard', 'success')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Add New User</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'super-admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={submitting}
            >
              <option value="user">User</option>
              <option value="super-admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (auto-generated)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                type="button"
                onClick={copyPassword}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                disabled={submitting}
              >
                ↻
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Save this password - it won&apos;t be shown again</p>
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
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md disabled:opacity-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * WHAT: Password display modal after regeneration
 * WHY: Show regenerated password securely with copy option
 */
function PasswordModal({
  password,
  onClose
}: {
  password: string
  onClose: () => void
}) {
  const { showToast } = useToast()

  function copyPassword() {
    navigator.clipboard.writeText(password)
    showToast('Password copied to clipboard', 'success')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Password Regenerated</h3>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <p className="text-sm text-yellow-800 mb-2">⚠️ Save this password now - it won&apos;t be shown again</p>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={password}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
          />
          <button
            onClick={copyPassword}
            className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 text-sm"
          >
            Copy
          </button>
        </div>

        <div className="flex justify-end">
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
