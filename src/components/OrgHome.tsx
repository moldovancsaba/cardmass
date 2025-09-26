"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchJSON } from '@/lib/client'

type Org = {
  uuid: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}


export default function OrgHome() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newOrg, setNewOrg] = useState({ name: '', slug: '' })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchJSON<Org[]>('/api/v1/organizations')
      setOrgs(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createOrg() {
    const name = newOrg.name.trim()
    const slug = newOrg.slug.trim()
    if (!name || !slug) { setError('Organization name and slug are required'); return }
    setLoading(true)
    setError(null)
    try {
      const created = await fetchJSON<Org>('/api/v1/organizations', {
        method: 'POST',
        body: JSON.stringify({ name, slug }),
      })
      // Add to list
      setOrgs((prev) => [created, ...prev])
      setNewOrg({ name: '', slug: '' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }


  function Row({ org }: { org: Org }) {
    return (
      <div className="border border-gray-200 rounded p-3 flex items-center justify-between">
        <div>
          <div className="font-medium">{org.name}</div>
          <div className="text-xs text-gray-500">slug: {org.slug}</div>
        </div>
        <div className="flex items-center gap-2">
          {/* UUID-first routing: open org page only. No Creator or New board on home. */}
          <Link className="underline text-[--color-brand]" href={`/${encodeURIComponent(org.uuid)}`}>Open</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Create Organization</h2>
        <div className="flex items-center gap-2">
          <input
            value={newOrg.name}
            onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
            placeholder="organization name"
            className="border border-gray-300 rounded px-2 py-1"
          />
          <input
            value={newOrg.slug}
            onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
            placeholder="slug (a-z,0-9,-)"
            className="border border-gray-300 rounded px-2 py-1"
          />
          <button className="border rounded px-3 py-1" onClick={createOrg} disabled={loading}>Create</button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Organizations</h2>
        {loading && <div className="text-sm text-gray-500">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="space-y-2">
          {orgs.map((o) => <Row key={o.uuid} org={o} />)}
          {!orgs.length && !loading && <div className="text-sm text-gray-500">No organizations yet. Create one above.</div>}
        </div>
      </div>
    </div>
  )
}