/**
 * WHAT: Organization admin management page with full user and board management
 * WHY: Org admins need complete CRUD capabilities for users and boards within their organization
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { OrgContextProvider } from '@/lib/org-context'
import { ToastProvider } from '@/components/ToastProvider'
import UsersTab from './_components/UsersTab'
import BoardsTab from './_components/BoardsTab'

function OrganizationAdminContent() {
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
              className="px-4 py-2 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
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
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'boards' && <BoardsTab />}
        {activeTab === 'passwords' && <PasswordManagementTab />}
      </main>
    </div>
  )
}

export default function OrganizationAdminPage() {
  return (
    <ToastProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }>
        <OrgContextProvider>
          <OrganizationAdminContent />
        </OrgContextProvider>
      </Suspense>
    </ToastProvider>
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
