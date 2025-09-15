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

  type FormState = {
    age_oldest: string
    age_newest: string
    rotten_least: string
    rotten_most: string
    archive_oldest: string
    archive_newest: string
    age_black: boolean
    rotten_black: boolean
    archive_black: boolean
    status_delegate: string
    status_decide: string
    status_do: string
    status_decline: string
    status_delegate_black: boolean
    status_decide_black: boolean
    status_do_black: boolean
    status_decline_black: boolean
    axis_important: string
    axis_not_important: string
    axis_urgent: string
    axis_not_urgent: string
    axis_important_black: boolean
    axis_not_important_black: boolean
    axis_urgent_black: boolean
    axis_not_urgent_black: boolean
    biz_key_partners: string
    biz_key_activities: string
    biz_key_resources: string
    biz_value_propositions: string
    biz_customer_relationships: string
    biz_channels: string
    biz_customer_segments: string
    biz_cost_structure: string
    biz_revenue_streams: string
    biz_key_partners_black: boolean
    biz_key_activities_black: boolean
    biz_key_resources_black: boolean
    biz_value_propositions_black: boolean
    biz_customer_relationships_black: boolean
    biz_channels_black: boolean
    biz_customer_segments_black: boolean
    biz_cost_structure_black: boolean
    biz_revenue_streams_black: boolean
  }

  const [form, setForm] = useState<FormState>({
    age_oldest: '#0a3d91',
    age_newest: '#9ecbff',
    rotten_least: '#2ecc71',
    rotten_most: '#8e5b3a',
    archive_oldest: '#6b7280',
    archive_newest: '#d1d5db',
    age_black: true,
    rotten_black: true,
    archive_black: true,
    // Status hashtag colors (kanban/matrix)
    status_delegate: '#93c5fd',
    status_decide: '#fde68a',
    status_do: '#86efac',
    status_decline: '#fca5a5',
    status_delegate_black: true,
    status_decide_black: true,
    status_do_black: true,
    status_decline_black: true,
    // Matrix axis colors
    axis_important: '#93c5fd',
    axis_not_important: '#bfdbfe',
    axis_urgent: '#fca5a5',
    axis_not_urgent: '#fecaca',
    axis_important_black: true,
    axis_not_important_black: true,
    axis_urgent_black: true,
    axis_not_urgent_black: true,
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
    biz_key_partners_black: true,
    biz_key_activities_black: true,
    biz_key_resources_black: true,
    biz_value_propositions_black: true,
    biz_customer_relationships_black: true,
    biz_channels_black: true,
    biz_customer_segments_black: true,
    biz_cost_structure_black: true,
    biz_revenue_streams_black: true,
  })

  useEffect(() => {
    let cancelled = false
    type S = { colors?: { age?: { oldest?: string; newest?: string }, rotten?: { least?: string; most?: string }, archive?: { oldest?: string; newest?: string }, status?: { delegate?: string; decide?: string; do?: string; decline?: string }, matrixAxis?: { important?: string; not_important?: string; urgent?: string; not_urgent?: string }, businessBadges?: { key_partners?: string; key_activities?: string; key_resources?: string; value_propositions?: string; customer_relationships?: string; channels?: string; customer_segments?: string; cost_structure?: string; revenue_streams?: string }, textContrast?: { status?: { delegate?: boolean; decide?: boolean; do?: boolean; decline?: boolean }, matrixAxis?: { important?: boolean; not_important?: boolean; urgent?: boolean; not_urgent?: boolean }, businessBadges?: { key_partners?: boolean; key_activities?: boolean; key_resources?: boolean; value_propositions?: boolean; customer_relationships?: boolean; channels?: boolean; customer_segments?: boolean; cost_structure?: boolean; revenue_streams?: boolean }, ranges?: { age?: boolean; rotten?: boolean; archive?: boolean } } }, business?: { key_partners?: string; key_activities?: string; key_resources?: string; value_propositions?: string; customer_relationships?: string; channels?: string; customer_segments?: string; cost_structure?: string; revenue_streams?: string } }
    fetchJSON<S>('/api/settings').then((s) => {
      if (cancelled) return
      setForm((prev) => ({
        ...prev,
        age_oldest: s.colors?.age?.oldest ?? prev.age_oldest,
        age_newest: s.colors?.age?.newest ?? prev.age_newest,
        rotten_least: s.colors?.rotten?.least ?? prev.rotten_least,
        rotten_most: s.colors?.rotten?.most ?? prev.rotten_most,
        archive_oldest: s.colors?.archive?.oldest ?? prev.archive_oldest,
        archive_newest: s.colors?.archive?.newest ?? prev.archive_newest,
        status_delegate: s.colors?.status?.delegate ?? prev.status_delegate,
        status_decide: s.colors?.status?.decide ?? prev.status_decide,
        status_do: s.colors?.status?.do ?? prev.status_do,
        status_decline: s.colors?.status?.decline ?? prev.status_decline,
        axis_important: s.colors?.matrixAxis?.important ?? prev.axis_important,
        axis_not_important: s.colors?.matrixAxis?.not_important ?? prev.axis_not_important,
        axis_urgent: s.colors?.matrixAxis?.urgent ?? prev.axis_urgent,
        axis_not_urgent: s.colors?.matrixAxis?.not_urgent ?? prev.axis_not_urgent,
        biz_key_partners: s.colors?.businessBadges?.key_partners ?? prev.biz_key_partners,
        biz_key_activities: s.colors?.businessBadges?.key_activities ?? prev.biz_key_activities,
        biz_key_resources: s.colors?.businessBadges?.key_resources ?? prev.biz_key_resources,
        biz_value_propositions: s.colors?.businessBadges?.value_propositions ?? prev.biz_value_propositions,
        biz_customer_relationships: s.colors?.businessBadges?.customer_relationships ?? prev.biz_customer_relationships,
        biz_channels: s.colors?.businessBadges?.channels ?? prev.biz_channels,
        biz_customer_segments: s.colors?.businessBadges?.customer_segments ?? prev.biz_customer_segments,
        biz_cost_structure: s.colors?.businessBadges?.cost_structure ?? prev.biz_cost_structure,
        biz_revenue_streams: s.colors?.businessBadges?.revenue_streams ?? prev.biz_revenue_streams,
        // load text contrast
        status_delegate_black: s.colors?.textContrast?.status?.delegate ?? prev.status_delegate_black,
        status_decide_black: s.colors?.textContrast?.status?.decide ?? prev.status_decide_black,
        status_do_black: s.colors?.textContrast?.status?.do ?? prev.status_do_black,
        status_decline_black: s.colors?.textContrast?.status?.decline ?? prev.status_decline_black,
        axis_important_black: s.colors?.textContrast?.matrixAxis?.important ?? prev.axis_important_black,
        axis_not_important_black: s.colors?.textContrast?.matrixAxis?.not_important ?? prev.axis_not_important_black,
        axis_urgent_black: s.colors?.textContrast?.matrixAxis?.urgent ?? prev.axis_urgent_black,
        axis_not_urgent_black: s.colors?.textContrast?.matrixAxis?.not_urgent ?? prev.axis_not_urgent_black,
        biz_key_partners_black: s.colors?.textContrast?.businessBadges?.key_partners ?? prev.biz_key_partners_black,
        biz_key_activities_black: s.colors?.textContrast?.businessBadges?.key_activities ?? prev.biz_key_activities_black,
        biz_key_resources_black: s.colors?.textContrast?.businessBadges?.key_resources ?? prev.biz_key_resources_black,
        biz_value_propositions_black: s.colors?.textContrast?.businessBadges?.value_propositions ?? prev.biz_value_propositions_black,
        biz_customer_relationships_black: s.colors?.textContrast?.businessBadges?.customer_relationships ?? prev.biz_customer_relationships_black,
        biz_channels_black: s.colors?.textContrast?.businessBadges?.channels ?? prev.biz_channels_black,
        biz_customer_segments_black: s.colors?.textContrast?.businessBadges?.customer_segments ?? prev.biz_customer_segments_black,
        biz_cost_structure_black: s.colors?.textContrast?.businessBadges?.cost_structure ?? prev.biz_cost_structure_black,
        biz_revenue_streams_black: s.colors?.textContrast?.businessBadges?.revenue_streams ?? prev.biz_revenue_streams_black,
        age_black: s.colors?.textContrast?.ranges?.age ?? prev.age_black,
        rotten_black: s.colors?.textContrast?.ranges?.rotten ?? prev.rotten_black,
        archive_black: s.colors?.textContrast?.ranges?.archive ?? prev.archive_black,
      }))
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
            status: { delegate: form.status_delegate, decide: form.status_decide, do: form.status_do, decline: form.status_decline },
            matrixAxis: { important: form.axis_important, not_important: form.axis_not_important, urgent: form.axis_urgent, not_urgent: form.axis_not_urgent },
            businessBadges: {
              key_partners: form.biz_key_partners,
              key_activities: form.biz_key_activities,
              key_resources: form.biz_key_resources,
              value_propositions: form.biz_value_propositions,
              customer_relationships: form.biz_customer_relationships,
              channels: form.biz_channels,
              customer_segments: form.biz_customer_segments,
              cost_structure: form.biz_cost_structure,
              revenue_streams: form.biz_revenue_streams,
            },
            textContrast: {
              status: {
                delegate: form.status_delegate_black,
                decide: form.status_decide_black,
                do: form.status_do_black,
                decline: form.status_decline_black,
              },
              matrixAxis: {
                important: form.axis_important_black,
                not_important: form.axis_not_important_black,
                urgent: form.axis_urgent_black,
                not_urgent: form.axis_not_urgent_black,
              },
              businessBadges: {
                key_partners: form.biz_key_partners_black,
                key_activities: form.biz_key_activities_black,
                key_resources: form.biz_key_resources_black,
                value_propositions: form.biz_value_propositions_black,
                customer_relationships: form.biz_customer_relationships_black,
                channels: form.biz_channels_black,
                customer_segments: form.biz_customer_segments_black,
                cost_structure: form.biz_cost_structure_black,
                revenue_streams: form.biz_revenue_streams_black,
              },
              ranges: { age: form.age_black, rotten: form.rotten_black, archive: form.archive_black },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <fieldset className="border border-gray-300 rounded p-3">
          <legend className="text-sm font-mono">Age gradient</legend>
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.age_black} onChange={(e) => setForm(f => ({...f, age_black: e.target.checked}))} />
              <button type="button" aria-label="Pick color for #Oldest" className="inline-block w-3 h-3 rounded-full border border-gray-400 cursor-pointer" style={{ backgroundColor: form.age_oldest }} onClick={() => { const el = document.getElementById('picker_age_oldest') as HTMLInputElement | null; el?.click() }} />
              <span
                role="button"
                className="px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer"
                style={{ backgroundColor: form.age_oldest, color: form.age_black ? '#000' : '#fff' }}
                onClick={() => { const el = document.getElementById('picker_age_oldest') as HTMLInputElement | null; el?.click() }}
              >#Oldest</span>
              <input id="picker_age_oldest" type="color" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} value={form.age_oldest} onChange={(e) => setForm(f => ({...f, age_oldest: e.target.value}))}/>
              <button type="button" aria-label="Pick color for #Newest" className="inline-block w-3 h-3 rounded-full border border-gray-400 cursor-pointer" style={{ backgroundColor: form.age_newest }} onClick={() => { const el = document.getElementById('picker_age_newest') as HTMLInputElement | null; el?.click() }} />
              <span
                role="button"
                className="px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer"
                style={{ backgroundColor: form.age_newest, color: form.age_black ? '#000' : '#fff' }}
                onClick={() => { const el = document.getElementById('picker_age_newest') as HTMLInputElement | null; el?.click() }}
              >#Newest</span>
              <input id="picker_age_newest" type="color" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} value={form.age_newest} onChange={(e) => setForm(f => ({...f, age_newest: e.target.value}))}/>
            </div>
          </div>
        </fieldset>
        <fieldset className="border border-gray-300 rounded p-3">
          <legend className="text-sm font-mono">Rotten gradient</legend>
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.rotten_black} onChange={(e) => setForm(f => ({...f, rotten_black: e.target.checked}))} />
              <button type="button" aria-label="Pick color for #Least" className="inline-block w-3 h-3 rounded-full border border-gray-400 cursor-pointer" style={{ backgroundColor: form.rotten_least }} onClick={() => { const el = document.getElementById('picker_rotten_least') as HTMLInputElement | null; el?.click() }} />
              <span
                role="button"
                className="px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer"
                style={{ backgroundColor: form.rotten_least, color: form.rotten_black ? '#000' : '#fff' }}
                onClick={() => { const el = document.getElementById('picker_rotten_least') as HTMLInputElement | null; el?.click() }}
              >#Least</span>
              <input id="picker_rotten_least" type="color" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} value={form.rotten_least} onChange={(e) => setForm(f => ({...f, rotten_least: e.target.value}))}/>
              <button type="button" aria-label="Pick color for #Most" className="inline-block w-3 h-3 rounded-full border border-gray-400 cursor-pointer" style={{ backgroundColor: form.rotten_most }} onClick={() => { const el = document.getElementById('picker_rotten_most') as HTMLInputElement | null; el?.click() }} />
              <span
                role="button"
                className="px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer"
                style={{ backgroundColor: form.rotten_most, color: form.rotten_black ? '#000' : '#fff' }}
                onClick={() => { const el = document.getElementById('picker_rotten_most') as HTMLInputElement | null; el?.click() }}
              >#Most</span>
              <input id="picker_rotten_most" type="color" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} value={form.rotten_most} onChange={(e) => setForm(f => ({...f, rotten_most: e.target.value}))}/>
            </div>
          </div>
        </fieldset>
        <fieldset className="border border-gray-300 rounded p-3">
          <legend className="text-sm font-mono">Archive gradient</legend>
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.archive_black} onChange={(e) => setForm(f => ({...f, archive_black: e.target.checked}))} />
              <button type="button" aria-label="Pick color for #Oldest" className="inline-block w-3 h-3 rounded-full border border-gray-400 cursor-pointer" style={{ backgroundColor: form.archive_oldest }} onClick={() => { const el = document.getElementById('picker_archive_oldest') as HTMLInputElement | null; el?.click() }} />
              <span
                role="button"
                className="px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer"
                style={{ backgroundColor: form.archive_oldest, color: form.archive_black ? '#000' : '#fff' }}
                onClick={() => { const el = document.getElementById('picker_archive_oldest') as HTMLInputElement | null; el?.click() }}
              >#Oldest</span>
              <input id="picker_archive_oldest" type="color" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} value={form.archive_oldest} onChange={(e) => setForm(f => ({...f, archive_oldest: e.target.value}))}/>
              <button type="button" aria-label="Pick color for #Newest" className="inline-block w-3 h-3 rounded-full border border-gray-400 cursor-pointer" style={{ backgroundColor: form.archive_newest }} onClick={() => { const el = document.getElementById('picker_archive_newest') as HTMLInputElement | null; el?.click() }} />
              <span
                role="button"
                className="px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer"
                style={{ backgroundColor: form.archive_newest, color: form.archive_black ? '#000' : '#fff' }}
                onClick={() => { const el = document.getElementById('picker_archive_newest') as HTMLInputElement | null; el?.click() }}
              >#Newest</span>
              <input id="picker_archive_newest" type="color" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} value={form.archive_newest} onChange={(e) => setForm(f => ({...f, archive_newest: e.target.value}))}/>
            </div>
          </div>
        </fieldset>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <fieldset className="border border-gray-300 rounded p-3">
          <legend className="text-sm font-mono">Matrix axis hashtag colors</legend>
          <div className="space-y-2 mt-2">
            {(() => {
              const rows: Array<[keyof FormState, keyof FormState, string]> = [
                ['axis_important','axis_important_black','#important'],
                ['axis_not_important','axis_not_important_black','#not-important'],
                ['axis_urgent','axis_urgent_black','#urgent'],
                ['axis_not_urgent','axis_not_urgent_black','#not-urgent'],
              ]
              return rows.map(([colorKey, textKey, label]) => {
                const id = `picker_${String(colorKey)}`
                const value = form[colorKey] as string
                const black = (form[textKey] as boolean) ?? true
                return (
                  <div key={String(colorKey)} className="flex items-center gap-2">
                    <input type="checkbox" checked={black} onChange={(e) => setForm(f => ({...f, [textKey]: e.target.checked } as FormState))} />
                    <button type="button" aria-label={`Pick color for ${label}`} className="inline-block w-3 h-3 rounded-full border border-gray-400 cursor-pointer" style={{ backgroundColor: value }} onClick={() => { const el = document.getElementById(id) as HTMLInputElement | null; el?.click() }} />
                    <span
                      role="button"
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer"
                      style={{ backgroundColor: value, color: black ? '#000' : '#fff' }}
                      onClick={() => { const el = document.getElementById(id) as HTMLInputElement | null; el?.click() }}
                    >{label}</span>
                    <input id={id} type="color" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} value={value} onChange={(e) => setForm(f => ({...f, [colorKey]: e.target.value } as FormState))}/>
                  </div>
                )
              })
            })()}
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 rounded p-3">
          <legend className="text-sm font-mono">Kanban hashtag colors</legend>
          <div className="space-y-2 mt-2">
            {(() => {
              const rows: Array<[keyof FormState, keyof FormState, string]> = [
                ['status_delegate','status_delegate_black','#delegate'],
                ['status_decide','status_decide_black','#decide'],
                ['status_do','status_do_black','#do'],
                ['status_decline','status_decline_black','#decline'],
              ]
              return rows.map(([colorKey, textKey, label]) => {
                const id = `picker_${String(colorKey)}`
                const value = form[colorKey] as string
                const black = (form[textKey] as boolean) ?? true
                return (
                  <div key={String(colorKey)} className="flex items-center gap-2">
                    <input type="checkbox" checked={black} onChange={(e) => setForm(f => ({...f, [textKey]: e.target.checked } as FormState))} />
                    <span
                      role="button"
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer"
                      style={{ backgroundColor: value, color: black ? '#000' : '#fff' }}
                      onClick={() => { const el = document.getElementById(id) as HTMLInputElement | null; el?.click() }}
                    >{label}</span>
<input id={id} type="color" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} value={value} onChange={(e) => setForm(f => ({...f, [colorKey]: e.target.value } as FormState))}/>
                  </div>
                )
              })
            })()}
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 rounded p-3">
          <legend className="text-sm font-mono">Business hashtag colors</legend>
          <div className="space-y-2 mt-2">
            {([
              ['key_partners','KeyPartners'], ['key_activities','KeyActivities'], ['key_resources','KeyResources'], ['value_propositions','ValuePropositions'],
              ['customer_relationships','CustomerRelationships'], ['channels','Channels'], ['customer_segments','CustomerSegments'], ['cost_structure','Cost'], ['revenue_streams','RevenueStream']
            ] as Array<[string, string]>).map(([k,hashtag]) => {
              const colorKey = `biz_${k}` as keyof FormState
              const textKey = `biz_${k}_black` as keyof FormState
              const id = `picker_${k}`
              const value = form[colorKey] as string
              const black = (form[textKey] as boolean) ?? true
              return (
                <div key={k} className="flex items-center gap-2">
                  <input type="checkbox" checked={black} onChange={(e) => setForm(f => ({...f, [textKey]: e.target.checked } as FormState))} />
                  <button type="button" aria-label={`Pick color for #${hashtag}`} className="inline-block w-3 h-3 rounded-full border border-gray-400 cursor-pointer" style={{ backgroundColor: value }} onClick={() => { const el = document.getElementById(id) as HTMLInputElement | null; el?.click() }} />
                  <span
                    role="button"
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono cursor-pointer"
                    style={{ backgroundColor: value, color: black ? '#000' : '#fff' }}
                    onClick={() => { const el = document.getElementById(id) as HTMLInputElement | null; el?.click() }}
                  >#{hashtag}</span>
                  <input id={id} type="color" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} value={value} onChange={(e) => setForm(f => ({...f, [colorKey]: e.target.value } as FormState))}/>
                </div>
              )
            })}
          </div>
        </fieldset>
      </div>
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
