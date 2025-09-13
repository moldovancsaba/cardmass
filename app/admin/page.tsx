'use client'

import { useEffect, useState } from 'react'
import { fetchJSON } from '@/lib/client'

import BottomBar from "@/components/BottomBar"
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  return (
    <main className="p-4 bg-white text-black flex flex-col xl:h-screen xl:overflow-hidden">
      <div className="flex-1 xl:overflow-hidden">
        <div className="border border-gray-300 rounded-lg p-3 h-full md:min-h-0 flex flex-col text-black bg-white">
          <div className="text-sm font-mono text-black mb-2">#admin</div>
          <div className="flex-1 overflow-auto pr-1">
            <SettingsForm />
          </div>
        </div>
      </div>
      <div className="pt-2 xl:pt-2">
        <BottomBar
          disabled
          view="kanban"
          showToggle={false}
          showArchive={true}
          showKanban={true}
          showMatrix={true}
          showBusiness={true}
          showAdmin={false}
          onArchiveNav={() => router.push('/archive')}
          onKanbanNav={() => router.push('/kanban')}
          onMatrixNav={() => router.push('/matrix')}
          onBusinessNav={() => router.push('/business')}
        />
      </div>
    </main>
  )
}

function SettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    age_oldest: '#0a3d91',
    age_newest: '#9ecbff',
    rotten_least: '#2ecc71',
    rotten_most: '#8e5b3a',
    archive_oldest: '#6b7280',
    archive_newest: '#d1d5db',
    b_kp: 'Key Partners',
    b_ka: 'Key Activities',
    b_kr: 'Key Resources',
    b_vp: 'Value Propositions',
    b_cr: 'Customer Relationships',
    b_ch: 'Channels',
    b_cs: 'Customer Segments',
    b_cost: 'Cost Structure',
    b_rev: 'Revenue Streams',
  })

  useEffect(() => {
    let cancelled = false
    type S = { colors?: { age?: { oldest?: string; newest?: string }, rotten?: { least?: string; most?: string }, archive?: { oldest?: string; newest?: string } }, business?: { key_partners?: string; key_activities?: string; key_resources?: string; value_propositions?: string; customer_relationships?: string; channels?: string; customer_segments?: string; cost_structure?: string; revenue_streams?: string } }
    fetchJSON<S>('/api/settings').then((s) => {
      if (cancelled) return
      setForm({
        age_oldest: s.colors?.age?.oldest ?? '#0a3d91',
        age_newest: s.colors?.age?.newest ?? '#9ecbff',
        rotten_least: s.colors?.rotten?.least ?? '#2ecc71',
        rotten_most: s.colors?.rotten?.most ?? '#8e5b3a',
        archive_oldest: s.colors?.archive?.oldest ?? '#6b7280',
        archive_newest: s.colors?.archive?.newest ?? '#d1d5db',
        b_kp: s.business?.key_partners ?? 'Key Partners',
        b_ka: s.business?.key_activities ?? 'Key Activities',
        b_kr: s.business?.key_resources ?? 'Key Resources',
        b_vp: s.business?.value_propositions ?? 'Value Propositions',
        b_cr: s.business?.customer_relationships ?? 'Customer Relationships',
        b_ch: s.business?.channels ?? 'Channels',
        b_cs: s.business?.customer_segments ?? 'Customer Segments',
        b_cost: s.business?.cost_structure ?? 'Cost Structure',
        b_rev: s.business?.revenue_streams ?? 'Revenue Streams',
      })
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [])

  async function save() {
    setSaving(true)
    try {
      await fetchJSON('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          colors: {
            age: { oldest: form.age_oldest, newest: form.age_newest },
            rotten: { least: form.rotten_least, most: form.rotten_most },
            archive: { oldest: form.archive_oldest, newest: form.archive_newest },
          },
          business: {
            key_partners: form.b_kp,
            key_activities: form.b_ka,
            key_resources: form.b_kr,
            value_propositions: form.b_vp,
            customer_relationships: form.b_cr,
            channels: form.b_ch,
            customer_segments: form.b_cs,
            cost_structure: form.b_cost,
            revenue_streams: form.b_rev,
          },
        }),
      })
      alert('Saved. Reload the board to see new colors applied.')
    } catch {
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading…</div>

  return (
    <div className="space-y-4 max-w-xl">
      <fieldset className="border border-gray-300 rounded p-3">
        <legend className="text-sm font-mono">Age bubble colors (oldest → newest)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <label className="flex items-center gap-2">Oldest
            <input type="color" value={form.age_oldest} onChange={(e) => setForm(f => ({...f, age_oldest: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Newest
            <input type="color" value={form.age_newest} onChange={(e) => setForm(f => ({...f, age_newest: e.target.value}))}/>
          </label>
        </div>
      </fieldset>
      <fieldset className="border border-gray-300 rounded p-3">
        <legend className="text-sm font-mono">Rotten bubble colors (least → most)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <label className="flex items-center gap-2">Least rotten
            <input type="color" value={form.rotten_least} onChange={(e) => setForm(f => ({...f, rotten_least: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Most rotten
            <input type="color" value={form.rotten_most} onChange={(e) => setForm(f => ({...f, rotten_most: e.target.value}))}/>
          </label>
        </div>
      </fieldset>
      <fieldset className="border border-gray-300 rounded p-3">
        <legend className="text-sm font-mono">Archive badge colors (oldest → newest)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <label className="flex items-center gap-2">Oldest
            <input type="color" value={form.archive_oldest} onChange={(e) => setForm(f => ({...f, archive_oldest: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Newest
            <input type="color" value={form.archive_newest} onChange={(e) => setForm(f => ({...f, archive_newest: e.target.value}))}/>
          </label>
        </div>
      </fieldset>
      <fieldset className="border border-gray-300 rounded p-3">
        <legend className="text-sm font-mono">Business Canvas Titles</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <label className="flex items-center gap-2">Key Partners
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="text" value={form.b_kp} onChange={(e) => setForm(f => ({...f, b_kp: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Key Activities
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="text" value={form.b_ka} onChange={(e) => setForm(f => ({...f, b_ka: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Key Resources
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="text" value={form.b_kr} onChange={(e) => setForm(f => ({...f, b_kr: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Value Propositions
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="text" value={form.b_vp} onChange={(e) => setForm(f => ({...f, b_vp: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Customer Relationships
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="text" value={form.b_cr} onChange={(e) => setForm(f => ({...f, b_cr: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Channels
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="text" value={form.b_ch} onChange={(e) => setForm(f => ({...f, b_ch: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Customer Segments
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="text" value={form.b_cs} onChange={(e) => setForm(f => ({...f, b_cs: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Cost Structure
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="text" value={form.b_cost} onChange={(e) => setForm(f => ({...f, b_cost: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">Revenue Streams
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="text" value={form.b_rev} onChange={(e) => setForm(f => ({...f, b_rev: e.target.value}))}/>
          </label>
        </div>
      </fieldset>
      <button
        onClick={save}
        disabled={saving}
        className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
