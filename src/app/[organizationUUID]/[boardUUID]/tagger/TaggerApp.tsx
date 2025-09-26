"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

type TileId = string
export type Area = { label: string; color: string; tiles: TileId[]; textBlack?: boolean }
export type Card = { id: string; uuid: string; text: string; status: 'delegate'|'decide'|'do'|'decline'; order: number; createdAt: string; updatedAt: string; boardAreas?: Record<string,string> }

type Props = { orgUUID: string; boardUUID: string; rows: number; cols: number; areas: Area[] }

export default function TaggerApp({ orgUUID, boardUUID, rows, cols, areas }: Props) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [boards, setBoards] = useState<Array<{ uuid: string; slug?: string }>>([])
  // Cache area colors per board UUID -> (labelLower -> color)
  const [labelColorCache, setLabelColorCache] = useState<Record<string, Record<string, string>>>({})
  const [labelTextMap, setLabelTextMap] = useState<Record<string, Record<string, boolean>>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [hoverArea, setHoverArea] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<{ area: string; cardId?: string; before?: boolean } | null>(null)
  // Inline edit state for placed cards
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState<string>('')

  const areaBoxes = useMemo(() => {
type Box = { key: string; label: string; color: string; textBlack: boolean; minR: number; minC: number; maxR: number; maxC: number }
const t2a = new Map<TileId, { label: string; color: string; textBlack?: boolean }>()
for (const a of (areas||[])) for (const t of (a.tiles||[])) t2a.set(t, { label: a.label, color: a.color, textBlack: a.textBlack })
    const map = new Map<string, Box>()
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
      const id=`${r}-${c}`; const a=t2a.get(id); if (!a) continue
      const key = (a.label||'').toLowerCase(); const b=map.get(key)
if (!b) map.set(key,{ key, label: key, color: a.color, textBlack: a.textBlack !== false, minR:r,minC:c,maxR:r,maxC:c })
      else { b.minR=Math.min(b.minR,r); b.minC=Math.min(b.minC,c); b.maxR=Math.max(b.maxR,r); b.maxC=Math.max(b.maxC,c) }
    }
    return Array.from(map.values())
  }, [rows, cols, areas])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards`, { cache:'no-store', headers: { 'X-Organization-UUID': orgUUID } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Load failed')
      setCards(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Load failed')
    } finally { setLoading(false) }
  }, [orgUUID])

  useEffect(() => { load() }, [load])

  // Load boards for navigation across Tagger pages
  useEffect(() => {
    let aborted = false
    async function loadBoards() {
      try {
        const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards`, { cache:'no-store', headers: { 'X-Organization-UUID': orgUUID } })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error?.message || 'Load boards failed')
        if (!aborted) setBoards(Array.isArray(data) ? data : [])
      } catch {}
    }
    loadBoards()
    return () => { aborted = true }
  }, [orgUUID])

  // Load area colors for boards referenced by cards.boardAreas for colored hashtags
  useEffect(() => {
    const needed = new Set<string>()
    for (const c of cards) {
      const ba = (c.boardAreas || {}) as Record<string, string>
      for (const k of Object.keys(ba)) if (k) needed.add(k)
    }
    const missing = Array.from(needed).filter((k) => !labelColorCache[k])
    if (missing.length === 0) return
    let aborted = false
    async function loadColors() {
      try {
        const entries = await Promise.all(missing.map(async (bid) => {
          const r = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards/${encodeURIComponent(bid)}`, { cache:'no-store', headers: { 'X-Organization-UUID': orgUUID } })
          if (!r.ok) return [bid, {} as Record<string, string>] as const
const data = await r.json() as { areas?: { label: string; color: string; textBlack?: boolean }[] }
const map: Record<string, string> = {}
          const tmap: Record<string, boolean> = {}
          for (const a of (data.areas || [])) {
            const lbl = (a.label || '').toLowerCase()
            if (!lbl) continue
map[lbl] = a.color
            tmap[lbl] = a.textBlack !== false
          }
return [bid, map, tmap] as const
        }))
        if (!aborted) {
          setLabelColorCache((prev) => {
            const next = { ...prev }
            for (const [bid, map] of entries) next[bid] = map
            return next
          })
          setLabelTextMap((prev) => {
            const next = { ...prev }
            for (const [bid, , tmap] of entries as unknown as Array<[string, Record<string,string>, Record<string,boolean>]>) next[bid] = tmap
            return next
          })
        }
      } catch {}
    }
    loadColors()
    return () => { aborted = true }
  }, [cards, orgUUID, labelColorCache])
  useEffect(() => {
    const onAny = () => load()
    try { window.addEventListener('card:created', onAny); window.addEventListener('card:updated', onAny); window.addEventListener('card:deleted', onAny) } catch {}
    try { const bc = new BroadcastChannel('cardmass'); const onMsg=(ev:MessageEvent)=>{ try{ const t=(ev.data&& (ev.data as {type?:string}).type)||''; if (t.startsWith('card:')) load() }catch{}}; bc.addEventListener('message', onMsg); return ()=>{ try{bc.removeEventListener('message', onMsg); bc.close()}catch{}; try{window.removeEventListener('card:created', onAny); window.removeEventListener('card:updated', onAny); window.removeEventListener('card:deleted', onAny)}catch{} } } catch { return ()=>{ try{window.removeEventListener('card:created', onAny); window.removeEventListener('card:updated', onAny); window.removeEventListener('card:deleted', onAny)}catch{} } }
  }, [load])

  const inbox = useMemo(() => {
    return cards.filter(c => !((c.boardAreas||{})[boardUUID]))
  }, [cards, boardUUID])

  const placedByArea = useMemo(() => {
    const map = new Map<string, Card[]>()
    for (const c of cards) {
      const lbl = ((c.boardAreas || {})[boardUUID] || '').toLowerCase()
      if (!lbl) continue
      const arr = map.get(lbl) || []
      arr.push(c)
      map.set(lbl, arr)
    }
    return map
  }, [cards, boardUUID])

  async function createCard() {
    const text = input.trim(); if (!text) return
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards`, { method:'POST', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ text, status:'decide' }) })
      const data = await res.json(); if (!res.ok) throw new Error(data?.error?.message || 'Create failed')
      setInput(''); try{ window.dispatchEvent(new CustomEvent('card:created')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:created'}); bc.close() }catch{}
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Create failed') }
  }

  async function placeCard(cardId: string, areaLabel: string, newOrder?: number) {
    // Update mapping using legacy PATCH for reliability (sets boardAreas.<key>)
    try {
      type CardPatchPayload = { boardArea?: { boardSlug?: string; areaLabel?: string }; order?: number }
      const payload: CardPatchPayload = { boardArea: { boardSlug: boardUUID, areaLabel } }
      if (typeof newOrder === 'number') payload.order = newOrder
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(cardId)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', 'X-Organization-UUID': orgUUID }, body: JSON.stringify(payload) })
      if (!res.ok) { const t = await res.text(); throw new Error(t || 'Update failed') }
      try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{}
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Update failed') }
  }

  function sortedAreaCards(label: string): Card[] {
    const arr = placedByArea.get(label) || []
    return [...arr].sort((a,b) => (a.order ?? 0) - (b.order ?? 0))
  }

  function computeNewOrder(label: string, targetId?: string, placeBefore?: boolean): number {
    const arr = sortedAreaCards(label)
    if (!arr.length) return 1
    if (!targetId) {
      // drop at end
      return (arr[arr.length - 1].order ?? 0) + 1
    }
    const idx = arr.findIndex(x => x.id === targetId)
    if (idx === -1) return (arr[arr.length - 1].order ?? 0) + 1
    if (placeBefore) {
      const next = arr[idx]
      const prev = arr[idx - 1]
      if (!prev) return (next.order ?? 0) - 1
      return ((prev.order ?? 0) + (next.order ?? 0)) / 2
    } else {
      const prev = arr[idx]
      const next = arr[idx + 1]
      if (!next) return (prev.order ?? 0) + 1
      return ((prev.order ?? 0) + (next.order ?? 0)) / 2
    }
  }

  return (
    <div className="w-full h-screen grid grid-cols-[320px_1fr]">
      {/* Left: Inbox & Create */}
      <aside className="border-r border-gray-200 p-3 overflow-hidden h-full flex flex-col">
        <h2 className="text-sm font-semibold mb-2">Inbox</h2>
        {loading && <div className="text-xs text-gray-500">Loading…</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {/* Scrollable inbox list */}
        <div className="space-y-2 mb-3 overflow-auto flex-1">
          {inbox.map(c => {
            const entries = Object.entries(c.boardAreas || {}) as Array<[string, string]>
            return (
              <div key={c.id} draggable onDragStart={(e)=>{ try{ (e.dataTransfer as DataTransfer).setData('text/plain', c.uuid) }catch{} }} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-black shadow-sm cursor-grab hover:bg-black/5" title={c.text}>
<div className="whitespace-pre-wrap break-words">{c.text}</div>
                {entries.length>0 && (
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                    {entries.map(([bid, lbl]) => {
                      const name = String(lbl||'').toLowerCase()
                      if (!name || name==='spock') return null
const color = (labelColorCache[bid] && labelColorCache[bid][name]) || '#e5e7eb'
const tBlack = !!(labelTextMap[bid] && labelTextMap[bid][name])
return (
                        <span key={`inbox-tag-${c.id}-${bid}-${name}`} className="px-1 rounded" style={{ backgroundColor: color, color: tBlack ? '#000' : '#fff' }}>#{name}</span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {inbox.length === 0 && !loading && <div className="text-xs text-gray-500">Inbox empty — create a card below or drag from other boards</div>}
        </div>
        {/* All boards navigation for Tagger */}
        <div className="mb-2 flex items-center gap-2 overflow-x-auto">
          {boards.map(b => (
            <a key={`nav-${b.uuid}`} href={`/${encodeURIComponent(orgUUID)}/${encodeURIComponent(b.uuid)}/tagger`} className={`border border-gray-300 rounded px-3 py-1 text-xs ${b.uuid===boardUUID ? 'bg-black text-white' : 'bg-white hover:bg-black/5'}`}>{b.slug || `board-${b.uuid.slice(0,6)}`}</a>
          ))}
        </div>
        {/* Bottom-stuck input with SPOCK-like behavior */}
        <div className="space-y-2">
          <textarea
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); void createCard(); } }}
            placeholder="Type a card and press Enter"
            className="w-full border border-gray-300 rounded p-2 text-sm resize-none min-h-[64px]"
          />
          <div className="text-[10px] text-gray-500">Enter to create • Shift+Enter for newline</div>
        </div>
      </aside>

      {/* Right: Grid with areas */}
      <section className="relative w-full h-full">
        <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
          {/* background grid */}
          {Array.from({ length: rows }, (_, r) => r).map((r) => (
            Array.from({ length: cols }, (_, c) => c).map((c) => (
              <div key={`cell-${r}-${c}`} className="border border-gray-200" />
            ))
          ))}

          {/* areas */}
          {areaBoxes.map((b) => (
            <div
              key={b.key}
              onDragOver={(e)=>{ e.preventDefault(); setHoverArea(b.key); setDropHint({ area: b.key }) }}
              onDragEnter={() => setHoverArea(b.key)}
              onDragLeave={(e)=>{ if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return; setHoverArea(null); setDropHint(null) }}
              onDrop={(e)=>{
                e.preventDefault();
                setHoverArea(null)
                setDropHint(null)
                try{
                  const id=(e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''
                  if (id) {
                    const newOrder = computeNewOrder(b.label)
                    placeCard(id, b.label, newOrder)
                  }
                }catch{}
              }}
              className={`relative border rounded-sm overflow-hidden ${hoverArea===b.key ? 'ring-2 ring-blue-400' : ''}`}
              style={{ gridColumn: `${b.minC + 1} / ${b.maxC + 2}`, gridRow: `${b.minR + 1} / ${b.maxR + 2}` }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(${parseInt(b.color.slice(1,3),16)}, ${parseInt(b.color.slice(3,5),16)}, ${parseInt(b.color.slice(5,7),16)}, 0.25)` }} />
<span className="absolute top-1 left-1 text-[10px] font-mono px-1 rounded-sm pointer-events-none z-10" style={{ backgroundColor: b.color, color: b.textBlack ? '#000' : '#fff' }}>#{b.label}</span>
              {/* Placed cards inside area */}
              <div className="absolute inset-0 overflow-auto p-2 pt-7 pb-2">
                <div className="flex flex-col gap-2">
                  {sortedAreaCards(b.label).map((c) => (
                    <div
                      key={`placed-${b.key}-${c.id}`}
                      draggable
                      onDragStart={(e)=>{ setDraggingId(c.uuid); try{ (e.dataTransfer as DataTransfer).setData('text/plain', c.uuid) }catch{} }}
                      onDragEnd={()=>{ setDraggingId(null); setDropHint(null) }}
                      onDragOver={(e)=>{ e.preventDefault(); const rect=(e.currentTarget as HTMLDivElement).getBoundingClientRect(); const isBefore = e.clientY < rect.top + rect.height/2; setDropHint({ area: b.key, cardId: c.id, before: isBefore }) }}
                      onDrop={(e)=>{
                        e.preventDefault()
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                        const isBefore = e.clientY < rect.top + rect.height/2
                        const id = (e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''
                        if (!id) return
                        setDropHint(null)
                        const newOrder = computeNewOrder(b.label, c.id, isBefore)
                        placeCard(id, b.label, newOrder)
                      }}
                      className={`relative border border-gray-300 rounded px-2 py-1 text-xs bg-white/90 text-black shadow-sm cursor-grab hover:bg-black/5 ${draggingId===c.uuid ? 'opacity-60' : ''}`}
                      title={c.text}
                    >
                      {/* insertion hint lines */}
                      {dropHint && dropHint.area===b.key && dropHint.cardId===c.id && dropHint.before && (
                        <div className="absolute left-1 right-1 -top-1 h-0.5 bg-blue-500 rounded-full pointer-events-none" />
                      )}
                      {dropHint && dropHint.area===b.key && dropHint.cardId===c.id && dropHint.before===false && (
                        <div className="absolute left-1 right-1 -bottom-1 h-0.5 bg-blue-500 rounded-full pointer-events-none" />
                      )}

                      <div className="pr-14">
                        {editingId===c.uuid ? (
                          <div>
                            <textarea
                              value={editText}
                              onChange={(e)=>setEditText(e.target.value)}
                              onKeyDown={async (e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); const next=editText.trim(); if (next) { try{ const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ text: next }) }); if (res.ok){ setCards(prev=>prev.map(x=>x.uuid===c.uuid?{...x, text: next}:x)); setEditingId(null); setEditText(''); try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{} } }catch{} } } if (e.key==='Escape'){ e.preventDefault(); setEditingId(null); setEditText('') } }}
                              className="w-full resize-none outline-none bg-white text-black min-h-[64px] border border-gray-300 rounded p-1"
                              placeholder="Edit text..."
                            />
                            <div className="mt-1 text-[10px] text-gray-500">Enter to save • Shift+Enter for newline • Esc to cancel</div>
                          </div>
                        ) : (
                          <>
<div className="whitespace-pre-wrap break-words" title={c.text}>{c.text}</div>
                            {/* labels from all boards */}
                            {Object.entries(c.boardAreas||{}).length>0 && (
                              <div className="mt-0.5 flex flex-wrap gap-1 text-[10px]">
                                {Object.entries(c.boardAreas||{}).map(([bid, lbl]) => {
                                  const name = String(lbl||'').toLowerCase()
                                  if (!name || name==='spock') return null
const color = (labelColorCache[bid] && labelColorCache[bid][name]) || '#e5e7eb'
const tBlack = !!(labelTextMap[bid] && labelTextMap[bid][name])
return (
                                    <span key={`placed-tag-${b.key}-${c.id}-${bid}-${name}`} className="px-1 rounded" style={{ backgroundColor: color, color: tBlack ? '#000' : '#fff' }}>#{name}</span>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* actions: edit/delete during normal; save/cancel when editing */}
                      <div className="absolute top-0 right-0 flex gap-1 p-0.5">
                        {editingId===c.uuid ? (
                          <>
                            <button onClick={async (e)=>{ e.preventDefault(); const next=editText.trim(); if (!next) return; try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ text: next }) }); if (res.ok){ setCards(prev=>prev.map(x=>x.uuid===c.uuid?{...x, text: next}:x)); setEditingId(null); setEditText(''); try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{} } }catch{} }} className="px-1 rounded bg-black text-white">save</button>
                            <button onClick={(e)=>{ e.preventDefault(); setEditingId(null); setEditText('') }} className="px-1 rounded bg-gray-200">cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={(e)=>{ e.preventDefault(); setEditingId(c.uuid); setEditText(c.text) }} className="px-1 rounded bg-black/5 hover:bg-black/10">edit</button>
                            <button onClick={async (e)=>{ e.preventDefault(); const ok=confirm('Delete this card?'); if(!ok) return; try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'DELETE', headers:{ 'X-Organization-UUID': orgUUID } }); if (res.ok){ setCards(prev=>prev.filter(x=>x.uuid!==c.uuid)); try{ window.dispatchEvent(new CustomEvent('card:deleted')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:deleted'}); bc.close() }catch{} } }catch{} }} className="px-1 rounded bg-red-50 hover:bg-red-100 text-red-700">del</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                {/* bottom insertion hint for area end */}
                {dropHint && dropHint.area===b.key && !dropHint.cardId && (
                  <div className="h-2 -mb-1 relative"><div className="absolute left-1 right-1 bottom-0 h-0.5 bg-blue-500 rounded-full pointer-events-none" /></div>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}