/**
 * WHAT: Organization admin management page
 * WHY: Org admins can manage users, boards, and passwords for their org
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserInfo {
  name: string
  email: string
  role: string
}

// Reserved for future full implementation
// interface OrgUser {
//   _id: string
//   email: string
//   name: string
//   role: 'user' | 'super-admin'
//   organizationAccess?: Array<{
//     organizationUUID: string
//     role: 'org-admin' | 'member'
//   }>
// }
// interface Board {
//   uuid: string
//   slug?: string
//   updatedAt?: string
//   version?: number
// }

export default function OrganizationAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'boards' | 'passwords'>('users')

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/check')
        const data = await res.json()
        
        if (!data.authenticated) {
          router.push('/admin/login?redirect=/organization/admin')
          return
        }
        
        // User authenticated - proceed
        setLoading(false)
      } catch {
        router.push('/admin/login')
      }
    }
    
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organization Admin</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage users, boards, and access controls
              </p>
            </div>
            <Link
              href="/organizations"
              className="px-4 py-2 text-sm rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              Back to Organizations
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('boards')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'boards'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Board Management
            </button>
            <button
              onClick={() => setActiveTab('passwords')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'passwords'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Access Passwords
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'users' && <UserManagementTab />}
        {activeTab === 'boards' && <BoardManagementTab />}
        {activeTab === 'passwords' && <PasswordManagementTab />}
      </main>
    </div>
  )
}

function UserManagementTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Organization Users</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
          Add User
        </button>
      </div>
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">User management UI coming soon</p>
        <p className="text-sm">Use API endpoints for now:</p>
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          POST /api/v1/organizations/{`{orgUUID}`}/users
        </code>
      </div>
    </div>
  )
}

function BoardManagementTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Organization Boards</h2>
        <Link
          href="/creator"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
        >
          Create Board
        </Link>
      </div>
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">Board management UI available via Creator</p>
        <p className="text-sm">Navigate to your organization page to see all boards</p>
      </div>
    </div>
  )
}

function PasswordManagementTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Board Access Passwords</h2>
      </div>
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">Password management UI coming soon</p>
        <p className="text-sm">Use API endpoints for now:</p>
        <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-2">
          POST /api/page-passwords
        </code>
        <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
          POST /api/v1/organizations/{`{orgUUID}`}/boards/{`{boardUUID}`}/regenerate-password
        </code>
      </div>
    </div>
  )
}
