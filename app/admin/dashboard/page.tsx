/**
 * WHAT: Comprehensive admin dashboard with tabbed management interface
 * WHY: Centralized access point for all admin operations: organizations, users, and overview
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ToastProvider } from '@/components/ToastProvider'
import OrganizationsTab from './_components/OrganizationsTab'
import SystemUsersTab from './_components/SystemUsersTab'

interface AdminUser {
  name: string
  email: string
  role: 'admin' | 'super-admin'
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'users'>('overview')
  const [organizations, setOrganizations] = useState<Array<{uuid: string; name: string; slug: string}>>([])
  const [stats, setStats] = useState<{orgs: number; users: number; boards: number}>({orgs: 0, users: 0, boards: 0})

  useEffect(() => {
    // WHAT: Check if user is authenticated
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user)
          // WHAT: Load organizations and stats after auth
          loadOrganizations()
          loadStats()
        } else {
          router.push('/admin/login?redirect=/admin/dashboard')
        }
      })
      .catch(() => {
        router.push('/admin/login?redirect=/admin/dashboard')
      })
      .finally(() => setLoading(false))
  }, [router])

  const loadOrganizations = async () => {
    try {
      const res = await fetch('/api/v1/organizations', {
        headers: { 'X-Organization-UUID': '00000000-0000-0000-0000-000000000000' }
      })
      const data = await res.json()
      if (data.organizations) {
        setOrganizations(data.organizations.slice(0, 5)) // WHAT: Show top 5 orgs
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  const loadStats = async () => {
    try {
      const [orgsRes, usersRes] = await Promise.all([
        fetch('/api/v1/organizations', { headers: { 'X-Organization-UUID': '00000000-0000-0000-0000-000000000000' } }),
        fetch('/api/admin/users')
      ])
      const orgsData = await orgsRes.json()
      const usersData = await usersRes.json()
      
      setStats({
        orgs: orgsData.organizations?.length || 0,
        users: usersData.users?.length || 0,
        boards: 0 // WHAT: Could aggregate across all orgs if needed
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Redirecting...
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Logged in as <span className="font-medium">{user.name}</span> ({user.email})
                  {user.role === 'super-admin' && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                      Super Admin
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('organizations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'organizations'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Organizations
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                System Users
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'organizations' && <OrganizationsTab />}
          {activeTab === 'users' && <SystemUsersTab />}
          {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} organizations={organizations} user={user} stats={stats} />}
        </main>
      </div>
    </ToastProvider>
  )
}

/**
 * WHAT: Overview tab with cards showing key system areas
 * WHY: Quick access to common admin functions and information
 */
interface OverviewTabProps {
  setActiveTab: (tab: 'overview' | 'organizations' | 'users') => void
  organizations: Array<{uuid: string; name: string; slug: string}>
  user: AdminUser | null
  stats: {orgs: number; users: number; boards: number}
}

function OverviewTab({ setActiveTab, organizations, user, stats }: OverviewTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Organizations Management */}
        <AdminCard
          title="Organizations"
          description="View and manage all organizations"
          icon="🏢"
          info={
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">{stats.orgs} organization{stats.orgs !== 1 ? 's' : ''} total</div>
              <button
                onClick={() => setActiveTab('organizations')}
                className="w-full px-3 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors font-medium"
              >
                Manage Organizations →
              </button>
            </div>
          }
        />

        {/* User Management */}
        <AdminCard
          title="User Management"
          description="Manage admin users and permissions"
          icon="👥"
          info={
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">{stats.users} user{stats.users !== 1 ? 's' : ''} total</div>
              <button
                onClick={() => setActiveTab('users')}
                className="w-full px-3 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors font-medium"
              >
                Manage Users →
              </button>
            </div>
          }
        />

        {/* Board Management */}
        <AdminCard
          title="Boards"
          description="View and manage all boards across organizations"
          icon="📋"
          links={organizations.length > 0 ? organizations.map(org => ({
            href: `/organization/${org.uuid}`,
            label: org.name,
            external: false
          })) : []}
          info={organizations.length === 0 ? 'No organizations yet. Create one first!' : `Quick access to ${organizations.length} organization${organizations.length !== 1 ? 's' : ''}`}
        />

        {/* Authentication */}
        <AdminCard
          title="Authentication"
          description="Manage authentication and sessions"
          icon="🔐"
          info={
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Logged in as:</span>
                <div className="text-gray-600 mt-1">{user?.email}</div>
                <div className="text-gray-500 text-xs mt-1">Role: {user?.role}</div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Session active (30-day expiry)
                </div>
              </div>
            </div>
          }
        />

        {/* Page Passwords */}
        <AdminCard
          title="Page Passwords"
          description="Generate and manage board access passwords"
          icon="🔑"
          info={
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Navigate to an organization to generate board passwords with the 🔑 button on each board.
              </div>
              {organizations.length > 0 && (
                <button
                  onClick={() => setActiveTab('organizations')}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Go to Organizations →
                </button>
              )}
            </div>
          }
        />

        {/* Documentation */}
        <AdminCard
          title="Documentation"
          description="View system documentation"
          icon="📚"
          links={[
            { href: 'https://github.com/moldovancsaba/cardmass/blob/main/AUTHENTICATION_AND_ACCESS.md', label: 'Auth Guide', external: true },
            { href: 'https://github.com/moldovancsaba/cardmass/blob/main/ARCHITECTURE.md', label: 'Architecture', external: true },
            { href: 'https://github.com/moldovancsaba/cardmass/blob/main/README.md', label: 'README', external: true },
          ]}
        />

        {/* Database */}
        <AdminCard
          title="Database"
          description="Database operations and maintenance"
          icon="💾"
          info="MongoDB Atlas cluster. Use scripts for database operations."
        />

        {/* Scripts & Tools */}
        <AdminCard
          title="CLI Scripts"
          description="Command-line management tools"
          icon="⚙️"
          info={
            <div className="text-xs space-y-1">
              <div><code className="bg-gray-100 px-1 rounded">node scripts/create-admin-quick.mjs</code> - Create admin</div>
              <div><code className="bg-gray-100 px-1 rounded">node scripts/verify-db.mjs</code> - Verify DB</div>
              <div><code className="bg-gray-100 px-1 rounded">node scripts/admin/update-password.mjs</code> - Change password</div>
            </div>
          }
        />

        {/* System Status */}
        <AdminCard
          title="System Status"
          description="Application health and monitoring"
          icon="📊"
          info={
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">Organizations</div>
                  <div className="text-lg font-semibold text-gray-900">{stats.orgs}</div>
                </div>
                <div>
                  <div className="text-gray-500">Users</div>
                  <div className="text-lg font-semibold text-gray-900">{stats.users}</div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Version</span>
                  <span className="font-mono text-gray-900">1.0.0</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Status</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Operational
                  </span>
                </div>
              </div>
            </div>
          }
        />

      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('organizations')}
            className="px-4 py-3 text-sm rounded-lg bg-sky-600 !text-white hover:bg-sky-700 hover:!text-white transition-colors text-center font-medium"
          >
            📋 Manage Organizations
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className="px-4 py-3 text-sm rounded-lg bg-sky-600 !text-white hover:bg-sky-700 hover:!text-white transition-colors text-center font-medium"
          >
            👥 Manage Users
          </button>
          <Link
            href="/"
            className="px-4 py-3 text-sm rounded-lg bg-sky-600 !text-white hover:bg-sky-700 hover:!text-white transition-colors text-center font-medium"
          >
            🏠 Organization Selector
          </Link>
        </div>
      </div>
    </>
  )
}

interface AdminCardProps {
  title: string
  description: string
  icon: string
  links?: Array<{
    href: string
    label: string
    external?: boolean
    badge?: string
    disabled?: boolean
  }>
  info?: React.ReactNode
}

function AdminCard({ title, description, icon, links, info }: AdminCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl">{icon}</div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      {links && links.length > 0 && (
        <div className="space-y-2 mb-3">
          {links.map((link, idx) => (
            <div key={idx}>
              {link.disabled ? (
                <span className="inline-flex items-center gap-2 text-sm text-gray-400">
                  {link.label}
                  {link.badge && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      {link.badge}
                    </span>
                  )}
                </span>
              ) : link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
                >
                  {link.label}
                  <span className="text-xs">↗</span>
                </a>
              ) : (
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
      
      {info && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-3">
          {info}
        </div>
      )}
    </div>
  )
}
