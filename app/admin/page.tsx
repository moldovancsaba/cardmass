'use client'

import { useEffect, useState } from 'react'
import { fetchJSON } from '@/lib/client'

import FooterNav from "@/components/FooterNav"

export default function AdminPage() {
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
        <FooterNav />
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
    // Status hashtag colors (kanban/matrix)
    status_delegate: '#93c5fd',
    status_decide: '#fde68a',
    status_do: '#86efac',
    status_decline: '#fca5a5',
    // Business hashtag colors
    biz_key_partners: '#e5e7eb',
    biz_key_activities: '#e5e7eb',
    biz_key_resources: '#e5e7eb',
    biz_value_propositions: '#e5e7eb',
    biz_customer_relationships: '#e5e7eb',
    biz_channels: '#e5e7eb',
    biz_customer_segments: '#e5e7eb',
    biz_cost_structure: '#e5e7eb',
    biz_revenue_streams: '#e5e7eb',
  })

  useEffect(() => {
    let cancelled = false
    type S = { colors?: { age?: { oldest?: string; newest?: string }, rotten?: { least?: string; most?: string }, archive?: { oldest?: string; newest?: string }, status?: { delegate?: string; decide?: string; do?: string; decline?: string }, businessBadges?: { key_partners?: string; key_activities?: string; key_resources?: string; value_propositions?: string; customer_relationships?: string; channels?: string; customer_segments?: string; cost_structure?: string; revenue_streams?: string } }, business?: { key_partners?: string; key_activities?: string; key_resources?: string; value_propositions?: string; customer_relationships?: string; channels?: string; customer_segments?: string; cost_structure?: string; revenue_streams?: string } }
    fetchJSON<S>('/api/settings').then((s) => {
      if (cancelled) return
      setForm({
        age_oldest: s.colors?.age?.oldest ?? '#0a3d91',
        age_newest: s.colors?.age?.newest ?? '#9ecbff',
        rotten_least: s.colors?.rotten?.least ?? '#2ecc71',
        rotten_most: s.colors?.rotten?.most ?? '#8e5b3a',
        archive_oldest: s.colors?.archive?.oldest ?? '#6b7280',
        archive_newest: s.colors?.archive?.newest ?? '#d1d5db',
        status_delegate: s.colors?.status?.delegate ?? '#93c5fd',
        status_decide: s.colors?.status?.decide ?? '#fde68a',
        status_do: s.colors?.status?.do ?? '#86efac',
        status_decline: s.colors?.status?.decline ?? '#fca5a5',
        biz_key_partners: s.colors?.businessBadges?.key_partners ?? '#e5e7eb',
        biz_key_activities: s.colors?.businessBadges?.key_activities ?? '#e5e7eb',
        biz_key_resources: s.colors?.businessBadges?.key_resources ?? '#e5e7eb',
        biz_value_propositions: s.colors?.businessBadges?.value_propositions ?? '#e5e7eb',
        biz_customer_relationships: s.colors?.businessBadges?.customer_relationships ?? '#e5e7eb',
        biz_channels: s.colors?.businessBadges?.channels ?? '#e5e7eb',
        biz_customer_segments: s.colors?.businessBadges?.customer_segments ?? '#e5e7eb',
        biz_cost_structure: s.colors?.businessBadges?.cost_structure ?? '#e5e7eb',
        biz_revenue_streams: s.colors?.businessBadges?.revenue_streams ?? '#e5e7eb',
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
            status: { delegate: (form as any).status_delegate, decide: (form as any).status_decide, do: (form as any).status_do, decline: (form as any).status_decline },
            businessBadges: {
              key_partners: (form as any).biz_key_partners,
              key_activities: (form as any).biz_key_activities,
              key_resources: (form as any).biz_key_resources,
              value_propositions: (form as any).biz_value_propositions,
              customer_relationships: (form as any).biz_customer_relationships,
              channels: (form as any).biz_channels,
              customer_segments: (form as any).biz_customer_segments,
              cost_structure: (form as any).biz_cost_structure,
              revenue_streams: (form as any).biz_revenue_streams,
            }
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
        <legend className="text-sm font-mono">Kanban hashtag colors</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <label className="flex items-center gap-2">#delegate
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="color" value={(form as any).status_delegate ?? '#93c5fd'} onChange={(e) => setForm(f => ({...f, status_delegate: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">#decide
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="color" value={(form as any).status_decide ?? '#fde68a'} onChange={(e) => setForm(f => ({...f, status_decide: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">#do
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="color" value={(form as any).status_do ?? '#86efac'} onChange={(e) => setForm(f => ({...f, status_do: e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">#decline
            <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="color" value={(form as any).status_decline ?? '#fca5a5'} onChange={(e) => setForm(f => ({...f, status_decline: e.target.value}))}/>
          </label>
        </div>
      </fieldset>

      <fieldset className="border border-gray-300 rounded p-3">
        <legend className="text-sm font-mono">Business hashtag colors</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {[
            ['key_partners','Key Partners'], ['key_activities','Key Activities'], ['key_resources','Key Resources'], ['value_propositions','Value Propositions'],
            ['customer_relationships','Customer Relationships'], ['channels','Channels'], ['customer_segments','Customer Segments'], ['cost_structure','Cost Structure'], ['revenue_streams','Revenue Streams']
          ].map(([k,label]) => (
            <label key={k} className="flex items-center gap-2">#{label}
              <input className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white text-black" type="color" value={(form as any)[`biz_${k}`] ?? '#e5e7eb'} onChange={(e) => setForm(f => ({...f, [`biz_${k}`]: e.target.value}))}/>
            </label>
          ))}
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
