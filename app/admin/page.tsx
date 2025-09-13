'use client'

import { useEffect, useState } from 'react'
import { fetchJSON } from '@/lib/client'

export default function AdminPage() {
  return (
    <main className="min-h-screen p-4 bg-white text-black">
      <h1 className="text-xl font-mono mb-4">#admin — hashtag color settings</h1>
      <SettingsForm />
      <div className="sticky bottom-0 mt-4 bg-white border border-gray-300 rounded-md p-2 flex items-center gap-2 justify-end">
        <a href="/kanban" className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black">kanban</a>
        <a href="/matrix" className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black">matrix</a>
        <a href="/archive" className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black">archive</a>
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
  })

  useEffect(() => {
    let cancelled = false
    type S = { colors?: { age?: { oldest?: string; newest?: string }, rotten?: { least?: string; most?: string } } }
    fetchJSON<S>('/api/settings').then((s) => {
      if (cancelled) return
      setForm({
        age_oldest: s.colors?.age?.oldest ?? '#0a3d91',
        age_newest: s.colors?.age?.newest ?? '#9ecbff',
        rotten_least: s.colors?.rotten?.least ?? '#2ecc71',
        rotten_most: s.colors?.rotten?.most ?? '#8e5b3a',
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
