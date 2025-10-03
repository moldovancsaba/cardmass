/**
 * WHAT: Comprehensive admin dashboard with links to all management functions
 * WHY: Centralized access point for all admin operations
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdminUser {
  name: string
  email: string
  role: 'admin' | 'super-admin'
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // WHAT: Check if user is authenticated
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user)
        } else {
          router.push('/admin/login?redirect=/admin/dashboard')
        }
      })
      .catch(() => {
        router.push('/admin/login?redirect=/admin/dashboard')
      })
      .finally(() => setLoading(false))
  }, [router])

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Organizations Management */}
          <AdminCard
            title="Organizations"
            description="View and manage all organizations"
            icon="🏢"
            links={[
              { href: '/api/v1/organizations', label: 'API: List Organizations', external: true },
              { href: '/', label: 'View Home', external: false },
            ]}
          />

          {/* User Management */}
          <AdminCard
            title="User Management"
            description="Manage admin users and permissions"
            icon="👥"
            links={[
              { href: '/admin/users', label: 'User Management UI', external: false, badge: 'Coming Soon', disabled: true },
            ]}
            info="Use CLI scripts for now: node scripts/create-admin-quick.mjs, node scripts/debug-users.mjs"
          />

          {/* Board Management */}
          <AdminCard
            title="Boards"
            description="View and manage all boards across organizations"
            icon="📋"
            links={[
              { href: '/api/v1/organizations', label: 'List All Orgs', external: true },
            ]}
            info="Navigate to specific organization to manage boards"
          />

          {/* Authentication */}
          <AdminCard
            title="Authentication"
            description="Manage authentication and sessions"
            icon="🔐"
            links={[
              { href: '/api/auth/check', label: 'Check Auth Status', external: true },
            ]}
            info="Current session is active. Use logout button to end session."
          />

          {/* Page Passwords */}
          <AdminCard
            title="Page Passwords"
            description="Generate and manage board access passwords"
            icon="🔑"
            links={[
              { href: '/admin/passwords', label: 'Password Management UI', external: false, badge: 'Coming Soon', disabled: true },
            ]}
            info="Use POST /api/page-passwords to generate passwords per board"
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
                <div><code className="bg-gray-100 px-1 rounded">node scripts/debug-users.mjs</code> - List users</div>
                <div><code className="bg-gray-100 px-1 rounded">node scripts/admin/update-password.mjs</code> - Change password</div>
              </div>
            }
          />

          {/* System Status */}
          <AdminCard
            title="System Status"
            description="Application health and monitoring"
            icon="📊"
            info="All systems operational. Version 0.18.0"
          />

        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/creator"
              className="px-4 py-3 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-center"
            >
              Create Board
            </Link>
            <Link
              href="/"
              className="px-4 py-3 text-sm rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors text-center"
            >
              View Organizations
            </Link>
            <button
              onClick={() => window.open('/api/v1/organizations', '_blank')}
              className="px-4 py-3 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-center"
            >
              API Explorer
            </button>
            <button
              onClick={() => alert('Feature coming soon!')}
              className="px-4 py-3 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-center"
            >
              Generate Password
            </button>
          </div>
        </div>
      </main>
    </div>
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
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {link.label}
                  <span className="text-xs">↗</span>
                </a>
              ) : (
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
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
