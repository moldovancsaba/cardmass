"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCardUrl } from '@/lib/urls'

type TileId = string
export type Area = { label: string; color: string; tiles: TileId[]; textBlack?: boolean }
export type Card = { id: string; uuid: string; text: string; status: 'delegate'|'decide'|'do'|'decline'; order: number; createdAt: string; updatedAt: string; boardAreas?: Record<string,string> }

type Props = { orgUUID: string; boardUUID: string; rows: number; cols: number; areas: Area[] }

export default function TaggerApp({ orgUUID, boardUUID, rows, cols, areas }: Props) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  // Inbox details toggle: show/hide hashtags and action buttons to control density
  // IMPORTANT: Initialize with a stable value to avoid SSR/client hydration mismatch.
  // Load the persisted value from localStorage after mount.
  const [showInboxDetails, setShowInboxDetails] = useState<boolean>(true)
  const [boards, setBoards] = useState<Array<{ uuid: string; slug?: string }>>([])
  // Cache area colors per board UUID -> (labelLower -> color)
  const [labelColorCache, setLabelColorCache] = useState<Record<string, Record<string, string>>>({})
  const [labelTextMap, setLabelTextMap] = useState<Record<string, Record<string, boolean>>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  // Track SPOCK container widths (desktop aside and stacked section); take the max visible width
  const spockDesktopRef = useRef<HTMLDivElement | null>(null)
  const spockStackedRef = useRef<HTMLDivElement | null>(null)
  const [spockWidth, setSpockWidth] = useState<number>(0)
  // Computed area content widths (existing)
  // Columns per area derived from (areaWidth / spockWidth), clamped by viewport breakpoints
  const [areaCols, setAreaCols] = useState<Record<string, number>>({})
  const [viewportCols, setViewportCols] = useState<number>(1)
  // Archive board detection (by slug: 'archive') to switch card list to archived-only
  const isArchiveBoard = useMemo(() => {
    const b = boards.find((x) => x.uuid === boardUUID)
    return ((b?.slug || '').toLowerCase() === 'archive')
  }, [boards, boardUUID])
  // WHAT: show a compact nav with a hamburger menu and the 3 most recently visited boards for quick switching.
  // WHY: Keeps UI minimal while offering fast access to commonly used boards.
  const [showMenu, setShowMenu] = useState(false)
  const [recentBoards, setRecentBoards] = useState<string[]>([])
  const [hoverArea, setHoverArea] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<{ area: string; cardId?: string; before?: boolean; slot?: number } | null>(null)
  // Inline edit state for placed cards
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState<string>('')
  // Inbox drop-target hover state
  // WHAT: Tracks when a dragged card is hovering over the Inbox list so we can show a visible cue and allow dropping there.
  // WHY: Dropping into the Inbox should clear the card's placement for the current board (see onDrop below), aligning with the soft "SPOCK" inbox model.
  const [inboxHover, setInboxHover] = useState(false)

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

  // Row-major ordered areas for stacked layout (<1200px): left-to-right, then top-to-bottom
  const orderedAreaBoxes = useMemo(() => {
    return [...areaBoxes].sort((a, b) => (a.minR - b.minR) || (a.minC - b.minC))
  }, [areaBoxes])

  // Measure area content widths to compute a unified card width (narrowest wins)
  const areaContentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const el2key = useRef(new WeakMap<Element, string>())
  const [areaWidths, setAreaWidths] = useState<Record<string, number>>({})

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      setAreaWidths((prev) => {
        const next = { ...prev }
        for (const entry of entries) {
          const key = el2key.current.get(entry.target)
          if (key) next[key] = entry.contentRect.width
        }
        return next
      })
    })
    Object.entries(areaContentRefs.current).forEach(([key, el]) => { if (el) ro.observe(el) })
    return () => { try { ro.disconnect() } catch {} }
  }, [areaBoxes])

  // Observe SPOCK container widths (both desktop and stacked), take the max
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      try {
        const w1 = spockDesktopRef.current ? spockDesktopRef.current.getBoundingClientRect().width : 0
        const w2 = spockStackedRef.current ? spockStackedRef.current.getBoundingClientRect().width : 0
        const w = Math.max(w1, w2, 0)
        setSpockWidth(w)
      } catch {}
    })
    try { if (spockDesktopRef.current) ro.observe(spockDesktopRef.current) } catch {}
    try { if (spockStackedRef.current) ro.observe(spockStackedRef.current) } catch {}
    return () => { try { ro.disconnect() } catch {} }
  }, [])

  // Track viewport breakpoint cols (1/<640, 2/≥640, 3/≥1280)
  useEffect(() => {
    if (typeof window === 'undefined') return
    function computeCols() {
      try {
        if (window.matchMedia('(min-width: 1280px)').matches) return 3
        if (window.matchMedia('(min-width: 640px)').matches) return 2
        return 1
      } catch {
        const w = window.innerWidth || 0
        if (w >= 1280) return 3
        if (w >= 640) return 2
        return 1
      }
    }
    const apply = () => setViewportCols(computeCols())
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  // Compute per-area max columns based on area vs. spock widths, clamped by viewport cols
  useEffect(() => {
    setAreaCols(() => {
      const next: Record<string, number> = {}
      const sw = spockWidth || 0
      for (const b of areaBoxes) {
        const aw = areaWidths[b.key] || 0
        let fromRatio = 1
        if (sw > 0 && aw > 0) {
          fromRatio = Math.floor(aw / sw)
          if (fromRatio < 1) fromRatio = 1
          if (fromRatio > 3) fromRatio = 3
        }
        next[b.key] = Math.max(1, Math.min(3, Math.min(fromRatio, viewportCols)))
      }
      return next
    })
  }, [areaBoxes, areaWidths, spockWidth, viewportCols])

  // Global uniform card width across the board (px), derived from SPOCK width and viewport columns
  const cardWidth = useMemo(() => {
    const GAP = 8
    const cols = Math.max(1, Math.min(3, viewportCols))
    // Prefer SPOCK width to define the baseline card width
    if (spockWidth && spockWidth > 0) {
      const avail = Math.max(0, spockWidth - (cols - 1) * GAP)
      const w = Math.floor(avail / cols)
      return Math.max(200, Math.min(480, w || 0))
    }
    // Fallback: use narrowest measured area width
    const vals = Object.values(areaWidths).filter((v) => v && isFinite(v))
    if (vals.length) {
      const minArea = Math.min(...vals)
      const avail = Math.max(0, minArea - (cols - 1) * GAP)
      const w = Math.floor(avail / cols)
      return Math.max(200, Math.min(480, w || 0))
    }
    return 320
  }, [viewportCols, spockWidth, areaWidths])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const qs = isArchiveBoard ? '?archived=only' : ''
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards${qs}`, { cache:'no-store', headers: { 'X-Organization-UUID': orgUUID } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Load failed')
      setCards(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Load failed')
    } finally { setLoading(false) }
  }, [orgUUID, isArchiveBoard])

  // Track recent boards in localStorage per organization
  useEffect(() => {
    try {
      const key = `cardmass:recents:${orgUUID}`
      const raw = localStorage.getItem(key)
      let list: string[] = []
      try { list = raw ? (JSON.parse(raw) as string[]) : [] } catch {}
      // Move current board to front
      list = [boardUUID, ...list.filter((x) => x !== boardUUID)]
      // Clamp to reasonable size (e.g., 10)
      if (list.length > 10) list = list.slice(0, 10)
      localStorage.setItem(key, JSON.stringify(list))
      setRecentBoards(list)
    } catch {}
  }, [orgUUID, boardUUID])

  const recent3 = useMemo(() => {
    const idx: Record<string, number> = {}
    recentBoards.forEach((id, i) => { idx[id] = i })
    const byRecent = [...boards].filter(b => recentBoards.includes(b.uuid)).sort((a,b) => (idx[a.uuid] ?? 999) - (idx[b.uuid] ?? 999))
    return byRecent.slice(0,3)
  }, [recentBoards, boards])


  // Close menu on Escape for accessibility
  useEffect(() => {
    if (!showMenu) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowMenu(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showMenu])

  useEffect(() => { load() }, [load])

  // Load persisted inbox details preference after mount to prevent hydration mismatches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`cardmass:inbox:details:${orgUUID}`)
      if (stored) setShowInboxDetails(stored !== 'hide')
    } catch {}
  }, [orgUUID])

  // Persist inbox details toggle per organization for consistent experience
  useEffect(() => {
    try { localStorage.setItem(`cardmass:inbox:details:${orgUUID}`, showInboxDetails ? 'show' : 'hide') } catch {}
  }, [orgUUID, showInboxDetails])


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
    <div className="w-full h-screen grid grid-cols-1 min-[1200px]:grid-cols-[320px_1fr] gap-3">
      {/* Left: Inbox & Create (desktop/≥1200px only) */}
      <aside className="hidden min-[1200px]:flex min-[1200px]:order-1 min-[1200px]:relative min-[1200px]:border-r border-gray-200 p-3 overflow-hidden h-full flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Inbox</h2>
          <button
            onClick={(e)=>{ e.preventDefault(); setShowInboxDetails(v=>!v) }}
            className="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white hover:bg-black/5"
            aria-pressed={showInboxDetails}
            title={showInboxDetails ? 'hide details' : 'show details'}
          >
            {showInboxDetails ? 'hide' : 'show'}
          </button>
        </div>
        {loading && <div className="text-xs text-gray-500">Loading…</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {/* Scrollable inbox list */}
        {/*
          WHAT: Make Inbox a valid drop target to move a card back from any area into the board's SPOCK inbox.
          WHY: Backend PATCH interprets an empty areaLabel for the given boardSlug as an UNSET operation (see cards/[cardUUID]/route.ts),
               which clears the per-board placement and returns the card to Inbox for this board.
        */}
        <div
          ref={spockDesktopRef}
          className={`space-y-2 mb-3 overflow-auto flex-1 ${inboxHover ? 'ring-2 ring-blue-400 rounded' : ''}`}
          onDragOver={(e)=>{ e.preventDefault(); setInboxHover(true) }}
          onDragLeave={()=>{ setInboxHover(false) }}
          onDrop={(e)=>{ e.preventDefault(); setInboxHover(false); try{ const id=(e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''; if (id) { /* Empty areaLabel clears placement => moves to SPOCK Inbox for this board */ placeCard(id, '', undefined) } }catch{} }}
        >
          {inbox.map(c => {
            const entries = Object.entries(c.boardAreas || {}) as Array<[string, string]>
            return (
              <div key={c.id} draggable onDragStart={(e)=>{ try{ (e.dataTransfer as DataTransfer).setData('text/plain', c.uuid) }catch{} }} className="relative border border-gray-300 rounded px-2 py-2 text-sm bg-white text-black shadow-sm cursor-grab hover:bg-black/5 w-full" title={c.text}>
                {/* content */}
                <div className="pr-0">
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
                    <div className="whitespace-pre-wrap break-words" title={c.text}>{c.text}</div>
                  )}
                </div>
                {showInboxDetails && entries.length>0 && (
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                    {entries.map(([bid, lbl]) => {
                      const name = String(lbl||'').toLowerCase()
                      if (!name || name==='spock') return null
                      const color = (labelColorCache[bid] && labelColorCache[bid][name]) || '#e5e7eb'
                      const tBlack = !!(labelTextMap[bid] && labelTextMap[bid][name])
return (
                        <a key={`inbox-tag-${c.id}-${bid}-${name}`} href={`/${encodeURIComponent(orgUUID)}/hashtags/resolve?board=${encodeURIComponent(bid)}&label=${encodeURIComponent(name)}`} className="px-1 rounded" style={{ backgroundColor: color, color: tBlack ? '#000' : '#fff' }} title={`Open #${name}`}>
                          #{name}
                        </a>
                      )
                    })}
                  </div>
                )}
                {/* actions moved to bottom to avoid overlaying text */}
                <div className={`mt-2 flex items-center gap-1 flex-wrap ${showInboxDetails || editingId===c.uuid ? '' : 'hidden'}`}>
                  {editingId===c.uuid ? (
                    <>
                      <button onClick={async (e)=>{ e.preventDefault(); const next=editText.trim(); if (!next) return; try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ text: next }) }); if (res.ok){ setCards(prev=>prev.map(x=>x.uuid===c.uuid?{...x, text: next}:x)); setEditingId(null); setEditText(''); try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{} } }catch{} }} className="px-2 py-0.5 text-xs rounded bg-black text-white">save</button>
                      <button onClick={(e)=>{ e.preventDefault(); setEditingId(null); setEditText('') }} className="px-2 py-0.5 text-xs rounded bg-gray-200">cancel</button>
                    </>
                  ) : (
                    <>
<a href={getCardUrl(orgUUID, c.uuid)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="open card in new tab" title="open">
                        <span className="material-symbols-outlined" aria-hidden="true">pageview</span>
                      </a>
{!isArchiveBoard && (
                      <button onClick={async (e)=>{ e.preventDefault(); try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ isArchived: true }) }); if (res.ok){ setCards(prev=>prev.filter(x=>x.uuid!==c.uuid)); try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{} } }catch{} }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="archive card" title="archive">
                        <span className="material-symbols-outlined" aria-hidden="true">archive</span>
                      </button>
                    )}
<button onClick={(e)=>{ e.preventDefault(); setEditingId(c.uuid); setEditText(c.text) }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="edit card" title="edit">
                        <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
                      </button>
<button onClick={async (e)=>{ e.preventDefault(); const ok=confirm('Delete this card?'); if(!ok) return; try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'DELETE', headers:{ 'X-Organization-UUID': orgUUID } }); if (res.ok){ setCards(prev=>prev.filter(x=>x.uuid!==c.uuid)); try{ window.dispatchEvent(new CustomEvent('card:deleted')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:deleted'}); bc.close() }catch{} } }catch{} }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="delete card" title="delete">
                        <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
          {inbox.length === 0 && !loading && <div className="text-xs text-gray-500">Inbox empty — create a card below or drag from other boards</div>}
        </div>
        {/* SPOCK nav: hamburger first, then 3 recent boards; overlay menu for full list */}
        <div className="mb-2 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setShowMenu(v => !v)}
            aria-label="Boards menu"
            aria-expanded={showMenu}
            className="border border-gray-300 rounded px-3 py-1 text-xs bg-white hover:bg-black/5"
          >
            ☰
          </button>
          {recent3.map(b => (
            <a key={`nav-recent-${b.uuid}`} href={`/${encodeURIComponent(orgUUID)}/${encodeURIComponent(b.uuid)}/tagger`} className={`border border-gray-300 rounded px-3 py-1 text-xs ${b.uuid===boardUUID ? 'bg-black text-white' : 'bg-white hover:bg-black/5'}`}>{b.slug || `board-${b.uuid.slice(0,6)}`}</a>
          ))}
        </div>

        {/* Overlay menu that covers the Inbox column */}
        {showMenu && (
          <div className="absolute inset-0 z-30" role="dialog" aria-modal="true">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/20" onClick={()=>setShowMenu(false)} />
            {/* panel */}
            <div className="absolute inset-0 p-3">
              <div className="mx-auto h-full w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                  <div className="text-sm font-semibold">Boards</div>
                  <button onClick={()=>setShowMenu(false)} className="px-2 py-1 text-xs rounded bg-black text-white">Close</button>
                </div>
                <div className="p-2 overflow-auto space-y-2">
                  {/* recent section */}
                  {recent3.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[11px] text-gray-500">Recent</div>
                      <div className="grid grid-cols-1 gap-1">
                        {recent3.map(b => (
                          <a
                            key={`ov-recent-${b.uuid}`}
                            href={`/${encodeURIComponent(orgUUID)}/${encodeURIComponent(b.uuid)}/tagger`}
                            onClick={()=>setShowMenu(false)}
                            className={`block rounded border px-3 py-2 text-sm ${b.uuid===boardUUID ? 'bg-black text-white border-black' : 'bg-white hover:bg-black/5 border-gray-300'}`}
                          >
                            {b.slug || `board-${b.uuid.slice(0,6)}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* all boards */}
                  <div>
                    <div className="px-2 pb-1 text-[11px] text-gray-500">All Boards</div>
                    <div className="grid grid-cols-1 gap-1">
                      {[...boards].map(b => (
                        <a
                          key={`ov-all-${b.uuid}`}
                          href={`/${encodeURIComponent(orgUUID)}/${encodeURIComponent(b.uuid)}/tagger`}
                          onClick={()=>setShowMenu(false)}
                          className={`block rounded border px-3 py-2 text-sm ${b.uuid===boardUUID ? 'bg-black text-white border-black' : 'bg-white hover:bg-black/5 border-gray-300'}`}
                        >
                          {b.slug || `board-${b.uuid.slice(0,6)}`}
                        </a>
                      ))}
                      {boards.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-500">No boards</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

      {/* Right: Areas */}
      <section className="order-1 min-[1200px]:order-2 relative w-full h-full">
        {/* Stacked (<1200px): single column scroll with half-screen panes */}
        <div className="block min-[1200px]:hidden h-full overflow-auto snap-y snap-mandatory p-2">
          {orderedAreaBoxes.map((b) => (
            <section key={`stack-${b.key}`} className="snap-start w-full h-[50svh] border rounded-sm relative overflow-hidden mb-2">
              {/* area background tint */}
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(${parseInt(b.color.slice(1,3),16)}, ${parseInt(b.color.slice(3,5),16)}, ${parseInt(b.color.slice(5,7),16)}, 0.25)` }} />
              <span className="absolute top-1 left-1 text-[10px] font-mono px-1 rounded-sm pointer-events-none z-10" style={{ backgroundColor: b.color, color: b.textBlack ? '#000' : '#fff' }}>#{b.label}</span>
              {/* Placed cards inside stacked pane */}
              <div className="absolute inset-0 overflow-auto p-2 pt-7 pb-2 grid gap-2 content-start justify-start items-start" style={{ gridTemplateColumns: `repeat(${areaCols[b.key] || viewportCols}, ${cardWidth}px)` }} ref={(el)=>{ areaContentRefs.current[b.key]=el; if (el) el2key.current.set(el, b.key) }}>
                <div className="contents">
                  {/* slot before first card */}
                  <div
                    className={`relative ${draggingId ? 'h-8 sm:h-6' : 'h-4 sm:h-3'} transition-[height,background-color] duration-150 -mx-1 px-2 ${dropHint && dropHint.area===b.key && dropHint.slot===0 ? 'bg-blue-100/70 rounded-md ring-1 ring-blue-300/50' : ''}`}
                    style={{ gridColumn: '1 / -1' }}
                    onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); setDropHint({ area: b.key, slot: 0 }) }}
                    onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); const id=(e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''; if(!id) return; setDropHint(null); const arr = sortedAreaCards(b.label); const newOrder = arr.length>0 ? computeNewOrder(b.label, arr[0].id, true) : 1; placeCard(id, b.label, newOrder) }}
                  >
                    {dropHint && dropHint.area===b.key && dropHint.slot===0 && (
                      <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-blue-500/90 filter drop-shadow-sm animate-pulse pointer-events-none" />
                    )}
                  </div>

                  {sortedAreaCards(b.label).map((c, idx) => (
                    <div key={`stack-placed-${b.key}-${c.id}`}>
                      <div
                        draggable
                        onDragStart={(e)=>{ setDraggingId(c.uuid); try{ (e.dataTransfer as DataTransfer).setData('text/plain', c.uuid) }catch{} }}
                        onDragEnd={()=>{ setDraggingId(null); setDropHint(null) }}
                        className={`relative border border-gray-300 rounded px-2 py-1 text-xs bg-white/90 text-black shadow-sm cursor-grab hover:bg-black/5 w-full ${draggingId===c.uuid ? 'opacity-60' : ''}`}
                        title={c.text}
                      >
                        <div className="pr-0">
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
                              {showInboxDetails && Object.entries(c.boardAreas||{}).length>0 && (
                                <div className="mt-0.5 flex flex-wrap gap-1 text-[10px]">
                                  {Object.entries(c.boardAreas||{}).map(([bid, lbl]) => {
                                    const name = String(lbl||'').toLowerCase()
                                    if (!name || name==='spock') return null
                                    const color = (labelColorCache[bid] && labelColorCache[bid][name]) || '#e5e7eb'
                                    const tBlack = !!(labelTextMap[bid] && labelTextMap[bid][name])
                                    return (
                                      <a key={`stack-placed-tag-${b.key}-${c.id}-${bid}-${name}`} href={`/${encodeURIComponent(orgUUID)}/hashtags/resolve?board=${encodeURIComponent(bid)}&label=${encodeURIComponent(name)}`} className="px-1 rounded" style={{ backgroundColor: color, color: tBlack ? '#000' : '#fff' }} title={`Open #${name}`}>
                                        #{name}
                                      </a>
                                    )
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* actions */}
                        <div className={`mt-2 flex items-center gap-1 flex-wrap ${showInboxDetails || editingId===c.uuid ? '' : 'hidden'}`}>
                          {editingId===c.uuid ? (
                            <>
                              <button onClick={async (e)=>{ e.preventDefault(); const next=editText.trim(); if (!next) return; try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ text: next }) }); if (res.ok){ setCards(prev=>prev.map(x=>x.uuid===c.uuid?{...x, text: next}:x)); setEditingId(null); setEditText(''); try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{} } }catch{} }} className="px-2 py-0.5 text-xs rounded bg-black text-white">save</button>
                              <button onClick={(e)=>{ e.preventDefault(); setEditingId(null); setEditText('') }} className="px-2 py-0.5 text-xs rounded bg-gray-200">cancel</button>
                            </>
                          ) : (
                            <>
                              <a href={getCardUrl(orgUUID, c.uuid)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="open card in new tab" title="open">
                                <span className="material-symbols-outlined" aria-hidden="true">pageview</span>
                              </a>
                              {!isArchiveBoard && (
                                <button onClick={async (e)=>{ e.preventDefault(); try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ isArchived: true }) }); if (res.ok){ setCards(prev=>prev.filter(x=>x.uuid!==c.uuid)); try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{} } }catch{} }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="archive card" title="archive">
                                  <span className="material-symbols-outlined" aria-hidden="true">archive</span>
                                </button>
                              )}
                              <button onClick={(e)=>{ e.preventDefault(); setEditingId(c.uuid); setEditText(c.text) }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="edit card" title="edit">
                                <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
                              </button>
                              <button onClick={async (e)=>{ e.preventDefault(); const ok=confirm('Delete this card?'); if(!ok) return; try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'DELETE', headers:{ 'X-Organization-UUID': orgUUID } }); if (res.ok){ setCards(prev=>prev.filter(x=>x.uuid!==c.uuid)); try{ window.dispatchEvent(new CustomEvent('card:deleted')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:deleted'}); bc.close() }catch{} } }catch{} }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="delete card" title="delete">
                                <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* slot after this card (only for single-column areas) */}
                      {(areaCols[b.key] || viewportCols) === 1 && (
                        <div
                          className={`relative ${draggingId ? 'h-8 sm:h-6' : 'h-4 sm:h-3'} transition-[height,background-color] duration-150 -mx-1 px-2 ${dropHint && dropHint.area===b.key && dropHint.slot===idx+1 ? 'bg-blue-100/70 rounded-md ring-1 ring-blue-300/50' : ''}`}
                          style={{ gridColumn: '1 / -1' }}
                          onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); setDropHint({ area: b.key, slot: idx+1 }) }}
                          onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); const id=(e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''; if(!id) return; setDropHint(null); const arr = sortedAreaCards(b.label); let newOrder: number; if (idx+1 >= arr.length) { newOrder = computeNewOrder(b.label) } else { newOrder = computeNewOrder(b.label, arr[idx+1].id, true) } placeCard(id, b.label, newOrder) }}
                        >
                          {dropHint && dropHint.area===b.key && dropHint.slot===idx+1 && (
                            <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-blue-500/90 filter drop-shadow-sm animate-pulse pointer-events-none" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* end-of-grid slot to drop at end (spans columns) */}
                <div
                  className={`relative ${draggingId ? 'h-8 sm:h-6' : 'h-4 sm:h-3'} transition-[height,background-color] duration-150 -mx-1 px-2 ${dropHint && dropHint.area===b.key && dropHint.slot===9999 ? 'bg-blue-100/70 rounded-md ring-1 ring-blue-300/50' : ''}`}
                  style={{ gridColumn: '1 / -1' }}
                  onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); setDropHint({ area: b.key, slot: 9999 }) }}
                  onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); const id=(e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''; if(!id) return; setDropHint(null); const newOrder = computeNewOrder(b.label); placeCard(id, b.label, newOrder) }}
                >
                  {dropHint && dropHint.area===b.key && dropHint.slot===9999 && (
                    <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-blue-500/90 filter drop-shadow-sm animate-pulse pointer-events-none" />
                  )}
                </div>
              </div>
            </section>
          ))}

          {/* SPOCK stacked section: full screen split (Inbox + Nav/Input) */}
          <section className="snap-start w-full h-[100svh] border rounded-sm overflow-hidden">
            <div className="h-[50svh] overflow-auto p-2" ref={spockStackedRef}>
              {/* Inbox list (reuse same DOM as aside, compact) */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Inbox</h2>
                <button
                  onClick={(e)=>{ e.preventDefault(); setShowInboxDetails(v=>!v) }}
                  className="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white hover:bg-black/5"
                  aria-pressed={showInboxDetails}
                  title={showInboxDetails ? 'hide details' : 'show details'}
                >
                  {showInboxDetails ? 'hide' : 'show'}
                </button>
              </div>
              {/* Scrollable inbox list */}
              <div
                className={`space-y-2 mb-3 overflow-auto`}
                onDragOver={(e)=>{ e.preventDefault(); setInboxHover(true) }}
                onDragLeave={()=>{ setInboxHover(false) }}
                onDrop={(e)=>{ e.preventDefault(); setInboxHover(false); try{ const id=(e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''; if (id) { placeCard(id, '', undefined) } }catch{} }}
              >
                {inbox.map(c => {
                  const entries = Object.entries(c.boardAreas || {}) as Array<[string, string]>
                  return (
                    <div key={`stack-inbox-${c.id}`} draggable onDragStart={(e)=>{ try{ (e.dataTransfer as DataTransfer).setData('text/plain', c.uuid) }catch{} }} className="relative border border-gray-300 rounded px-2 py-2 text-sm bg-white text-black shadow-sm cursor-grab hover:bg-black/5 w-full" title={c.text}>
                      <div className="whitespace-pre-wrap break-words" title={c.text}>{c.text}</div>
                      {showInboxDetails && entries.length>0 && (
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                          {entries.map(([bid, lbl]) => {
                            const name = String(lbl||'').toLowerCase()
                            if (!name || name==='spock') return null
                            const color = (labelColorCache[bid] && labelColorCache[bid][name]) || '#e5e7eb'
                            const tBlack = !!(labelTextMap[bid] && labelTextMap[bid][name])
                            return (
                              <a key={`stack-inbox-tag-${c.id}-${bid}-${name}`} href={`/${encodeURIComponent(orgUUID)}/hashtags/resolve?board=${encodeURIComponent(bid)}&label=${encodeURIComponent(name)}`} className="px-1 rounded" style={{ backgroundColor: color, color: tBlack ? '#000' : '#fff' }} title={`Open #${name}`}>
                                #{name}
                              </a>
                            )
                          })}
                        </div>
                      )}
                      <div className={`mt-2 flex items-center gap-1 flex-wrap ${showInboxDetails || editingId===c.uuid ? '' : 'hidden'}`}>
                        <a href={getCardUrl(orgUUID, c.uuid)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="open card in new tab" title="open">
                          <span className="material-symbols-outlined" aria-hidden="true">pageview</span>
                        </a>
                        {!isArchiveBoard && (
                          <button onClick={async (e)=>{ e.preventDefault(); try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ isArchived: true }) }); if (res.ok){ setCards(prev=>prev.filter(x=>x.uuid!==c.uuid)); try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{} } }catch{} }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="archive card" title="archive">
                            <span className="material-symbols-outlined" aria-hidden="true">archive</span>
                          </button>
                        )}
                        <button onClick={(e)=>{ e.preventDefault(); setEditingId(c.uuid); setEditText(c.text) }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="edit card" title="edit">
                          <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
                        </button>
                        <button onClick={async (e)=>{ e.preventDefault(); const ok=confirm('Delete this card?'); if(!ok) return; try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'DELETE', headers:{ 'X-Organization-UUID': orgUUID } }); if (res.ok){ setCards(prev=>prev.filter(x=>x.uuid!==c.uuid)); try{ window.dispatchEvent(new CustomEvent('card:deleted')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:deleted'}); bc.close() }catch{} } }catch{} }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="delete card" title="delete">
                          <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
                {inbox.length === 0 && !loading && <div className="text-xs text-gray-500">Inbox empty — create a card below or drag from other boards</div>}
              </div>
            </div>
            {/* bottom half: nav + input */}
            <div className="h-[50svh] border-t overflow-auto p-2">
              <div className="mb-2 flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setShowMenu(v => !v)}
                  aria-label="Boards menu"
                  aria-expanded={showMenu}
                  className="border border-gray-300 rounded px-3 py-1 text-xs bg-white hover:bg-black/5"
                >
                  ☰
                </button>
                {recent3.map(b => (
                  <a key={`stack-nav-recent-${b.uuid}`} href={`/${encodeURIComponent(orgUUID)}/${encodeURIComponent(b.uuid)}/tagger`} className={`border border-gray-300 rounded px-3 py-1 text-xs ${b.uuid===boardUUID ? 'bg-black text-white' : 'bg-white hover:bg-black/5'}`}>{b.slug || `board-${b.uuid.slice(0,6)}`}</a>
                ))}
              </div>
              {showMenu && (
                <div className="relative">
                  <div className="absolute inset-0 z-30" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/20" onClick={()=>setShowMenu(false)} />
                    <div className="absolute inset-0 p-3">
                      <div className="mx-auto h-full w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                          <div className="text-sm font-semibold">Boards</div>
                          <button onClick={()=>setShowMenu(false)} className="px-2 py-1 text-xs rounded bg-black text-white">Close</button>
                        </div>
                        <div className="p-2 overflow-auto space-y-2">
                          {recent3.length > 0 && (
                            <div>
                              <div className="px-2 pb-1 text-[11px] text-gray-500">Recent</div>
                              <div className="grid grid-cols-1 gap-1">
                                {recent3.map(b => (
                                  <a
                                    key={`stack-ov-recent-${b.uuid}`}
                                    href={`/${encodeURIComponent(orgUUID)}/${encodeURIComponent(b.uuid)}/tagger`}
                                    onClick={()=>setShowMenu(false)}
                                    className={`block rounded border px-3 py-2 text-sm ${b.uuid===boardUUID ? 'bg-black text-white border-black' : 'bg-white hover:bg-black/5 border-gray-300'}`}
                                  >
                                    {b.slug || `board-${b.uuid.slice(0,6)}`}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="px-2 pb-1 text-[11px] text-gray-500">All Boards</div>
                            <div className="grid grid-cols-1 gap-1">
                              {[...boards].map(b => (
                                <a
                                  key={`stack-ov-all-${b.uuid}`}
                                  href={`/${encodeURIComponent(orgUUID)}/${encodeURIComponent(b.uuid)}/tagger`}
                                  onClick={()=>setShowMenu(false)}
                                  className={`block rounded border px-3 py-2 text-sm ${b.uuid===boardUUID ? 'bg-black text-white border-black' : 'bg-white hover:bg-black/5 border-gray-300'}`}
                                >
                                  {b.slug || `board-${b.uuid.slice(0,6)}`}
                                </a>
                              ))}
                              {boards.length === 0 && (
                                <div className="px-3 py-2 text-xs text-gray-500">No boards</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* composer */}
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
            </div>
          </section>
        </div>

        {/* Desktop (≥1200px): mosaic grid */}
        <div className="hidden min-[1200px]:grid w-full h-full gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
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
              onDragOver={(e)=>{ e.preventDefault(); setHoverArea(b.key) }}
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
              <div className="absolute inset-0 overflow-auto p-2 pt-7 pb-2 grid gap-2 content-start justify-start items-start" style={{ gridTemplateColumns: `repeat(${areaCols[b.key] || viewportCols}, ${cardWidth}px)` }} ref={(el)=>{ areaContentRefs.current[b.key]=el; if (el) el2key.current.set(el, b.key) }}>
                <div className="contents">
                  {/* slot before the first card (position 0) */}
                  {/*
                    WHAT: Slot before the first card. On mobile/touch (base breakpoint) make it a bit taller and widen hit area with negative margins.
                    WHY: Improves targetability and clarity on small screens.
                  */}
                  <div
                    className={`relative ${draggingId ? 'h-8 sm:h-6' : 'h-4 sm:h-3'} transition-[height,background-color] duration-150 -mx-1 px-2 sm:mx-0 sm:px-0 ${dropHint && dropHint.area===b.key && dropHint.slot===0 ? 'bg-blue-100/70 rounded-md ring-1 ring-blue-300/50' : ''}`}
                    style={{ gridColumn: '1 / -1' }}
                    onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); setDropHint({ area: b.key, slot: 0 }) }}
                    onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); const id=(e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''; if(!id) return; setDropHint(null); const arr = sortedAreaCards(b.label); const newOrder = arr.length>0 ? computeNewOrder(b.label, arr[0].id, true) : 1; placeCard(id, b.label, newOrder) }}
                  >
                    {dropHint && dropHint.area===b.key && dropHint.slot===0 && (
                      <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-blue-500/90 filter drop-shadow-sm animate-pulse pointer-events-none" />
                    )}
                  </div>

                  {sortedAreaCards(b.label).map((c, idx) => (
                    <div key={`placed-wrap-${b.key}-${c.id}`}>
                      <div
                        key={`placed-${b.key}-${c.id}`}
                        draggable
                        onDragStart={(e)=>{ setDraggingId(c.uuid); try{ (e.dataTransfer as DataTransfer).setData('text/plain', c.uuid) }catch{} }}
                        onDragEnd={()=>{ setDraggingId(null); setDropHint(null) }}
                        className={`relative border border-gray-300 rounded px-2 py-1 text-xs bg-white/90 text-black shadow-sm cursor-grab hover:bg-black/5 w-full ${draggingId===c.uuid ? 'opacity-60' : ''}`}
                        title={c.text}
                      >
                        <div className="pr-0">
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
                              {showInboxDetails && Object.entries(c.boardAreas||{}).length>0 && (
                                <div className="mt-0.5 flex flex-wrap gap-1 text-[10px]">
                                  {Object.entries(c.boardAreas||{}).map(([bid, lbl]) => {
                                    const name = String(lbl||'').toLowerCase()
                                    if (!name || name==='spock') return null
                                    const color = (labelColorCache[bid] && labelColorCache[bid][name]) || '#e5e7eb'
                                    const tBlack = !!(labelTextMap[bid] && labelTextMap[bid][name])
return (
                                      <a key={`placed-tag-${b.key}-${c.id}-${bid}-${name}`} href={`/${encodeURIComponent(orgUUID)}/hashtags/resolve?board=${encodeURIComponent(bid)}&label=${encodeURIComponent(name)}`} className="px-1 rounded" style={{ backgroundColor: color, color: tBlack ? '#000' : '#fff' }} title={`Open #${name}`}>
                                        #{name}
                                      </a>
                                    )
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* actions moved to bottom to avoid overlaying text */}
                        <div className={`mt-2 flex items-center gap-1 flex-wrap ${showInboxDetails || editingId===c.uuid ? '' : 'hidden'}`}>
                          {editingId===c.uuid ? (
                            <>
                              <button onClick={async (e)=>{ e.preventDefault(); const next=editText.trim(); if (!next) return; try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ text: next }) }); if (res.ok){ setCards(prev=>prev.map(x=>x.uuid===c.uuid?{...x, text: next}:x)); setEditingId(null); setEditText(''); try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{} } }catch{} }} className="px-2 py-0.5 text-xs rounded bg-black text-white">save</button>
                              <button onClick={(e)=>{ e.preventDefault(); setEditingId(null); setEditText('') }} className="px-2 py-0.5 text-xs rounded bg-gray-200">cancel</button>
                            </>
                          ) : (
                            <>
<a href={getCardUrl(orgUUID, c.uuid)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="open card in new tab" title="open">
                                <span className="material-symbols-outlined" aria-hidden="true">pageview</span>
                              </a>
{!isArchiveBoard && (
                              <button onClick={async (e)=>{ e.preventDefault(); try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','X-Organization-UUID': orgUUID }, body: JSON.stringify({ isArchived: true }) }); if (res.ok){ setCards(prev=>prev.filter(x=>x.uuid!==c.uuid)); try{ window.dispatchEvent(new CustomEvent('card:updated')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:updated'}); bc.close() }catch{} } }catch{} }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="archive card" title="archive">
                                <span className="material-symbols-outlined" aria-hidden="true">archive</span>
                              </button>
                            )}
<button onClick={(e)=>{ e.preventDefault(); setEditingId(c.uuid); setEditText(c.text) }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="edit card" title="edit">
                                <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
                              </button>
<button onClick={async (e)=>{ e.preventDefault(); const ok=confirm('Delete this card?'); if(!ok) return; try{ const res=await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(c.uuid)}`, { method:'DELETE', headers:{ 'X-Organization-UUID': orgUUID } }); if (res.ok){ setCards(prev=>prev.filter(x=>x.uuid!==c.uuid)); try{ window.dispatchEvent(new CustomEvent('card:deleted')) }catch{}; try{ const bc=new BroadcastChannel('cardmass'); bc.postMessage({type:'card:deleted'}); bc.close() }catch{} } }catch{} }} className="inline-flex items-center justify-center h-8 w-8 rounded text-black hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="delete card" title="delete">
                                <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* slot after this card (only for single-column areas) */}
                      {(areaCols[b.key] || viewportCols) === 1 && (
                        <div
                          className={`relative ${draggingId ? 'h-8 sm:h-6' : 'h-4 sm:h-3'} transition-[height,background-color] duration-150 -mx-1 px-2 sm:mx-0 sm:px-0 ${dropHint && dropHint.area===b.key && dropHint.slot===idx+1 ? 'bg-blue-100/70 rounded-md ring-1 ring-blue-300/50' : ''}`}
                          style={{ gridColumn: '1 / -1' }}
                          onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); setDropHint({ area: b.key, slot: idx+1 }) }}
                          onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); const id=(e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''; if(!id) return; setDropHint(null); const arr = sortedAreaCards(b.label); let newOrder: number; if (idx+1 >= arr.length) { newOrder = computeNewOrder(b.label) } else { newOrder = computeNewOrder(b.label, arr[idx+1].id, true) } placeCard(id, b.label, newOrder) }}
                        >
                          {dropHint && dropHint.area===b.key && dropHint.slot===idx+1 && (
                            <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-blue-500/90 filter drop-shadow-sm animate-pulse pointer-events-none" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* end-of-grid slot to drop at end (spans columns) */}
                <div
                  className={`relative ${draggingId ? 'h-8 sm:h-6' : 'h-4 sm:h-3'} transition-[height,background-color] duration-150 -mx-1 px-2 sm:mx-0 sm:px-0 ${dropHint && dropHint.area===b.key && dropHint.slot===9998 ? 'bg-blue-100/70 rounded-md ring-1 ring-blue-300/50' : ''}`}
                  style={{ gridColumn: '1 / -1' }}
                  onDragOver={(e)=>{ e.preventDefault(); e.stopPropagation(); setDropHint({ area: b.key, slot: 9998 }) }}
                  onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); const id=(e.dataTransfer as DataTransfer).getData('text/plain') || draggingId || ''; if(!id) return; setDropHint(null); const newOrder = computeNewOrder(b.label); placeCard(id, b.label, newOrder) }}
                >
                  {dropHint && dropHint.area===b.key && dropHint.slot===9998 && (
                    <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-blue-500/90 filter drop-shadow-sm animate-pulse pointer-events-none" />
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