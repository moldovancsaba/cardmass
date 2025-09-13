'use client'

import { useEffect, useState } from 'react'
import { fetchJSON } from '@/lib/client'

import BottomBar from "@/components/BottomBar"

export default function AdminPage() {
  return (
    <main className="min-h-screen p-4 bg-white text-black flex flex-col">
      <div className="border border-gray-300 rounded-lg p-3 md:h-[calc(100vh-10rem)] flex flex-col text-black bg-white">
        <div className="text-sm font-mono text-black mb-2">#admin</div>
        <div className="flex-1 overflow-auto pr-1">
          <SettingsForm />
        </div>
      </div>
      <BottomBar
        disabled
        view="kanban"
        showToggle={false}
        showArchive={true}
        showKanban={true}
        showMatrix={true}
        onArchiveNav={() => (window.location.href = '/archive')}
        onKanbanNav={() => (window.location.href = '/kanban')}
        onMatrixNav={() => (window.location.href = '/matrix')}
      />
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
  })

  useEffect(() => {
    let cancelled = false
    type S = { colors?: { age?: { oldest?: string; newest?: string }, rotten?: { least?: string; most?: string }, archive?: { oldest?: string; newest?: string } } }
    fetchJSON<S>('/api/settings').then((s) => {
      if (cancelled) return
      setForm({
        age_oldest: s.colors?.age?.oldest ?? '#0a3d91',
        age_newest: s.colors?.age?.newest ?? '#9ecbff',
        rotten_least: s.colors?.rotten?.least ?? '#2ecc71',
        rotten_most: s.colors?.rotten?.most ?? '#8e5b3a',
        archive_oldest: s.colors?.archive?.oldest ?? '#6b7280',
        archive_newest: s.colors?.archive?.newest ?? '#d1d5db',
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
