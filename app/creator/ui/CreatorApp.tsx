"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// CreatorApp — Grid Territory Builder
// What: A square grid where you can set rows/cols, set a board slug, pick a color, select tiles, and commit
//       labeled colored territories (as many as you want). Data persists locally via localStorage.
// Why: Matches requirements for direct, visual creation without backend dependence.

type TileId = string; // "r-c"
interface Area { id: string; label: string; color: string; tiles: TileId[]; textBlack?: boolean }
interface Store {
  version: number;
  slug: string;
  rows: number;
  cols: number;
  areas: Area[];
}

const STORAGE_KEY = "cardmass.grid.creator.v1";
const uid = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}


const defaultStore: Store = {
  version: 1,
  slug: "",
  rows: 0,
  cols: 0,
  areas: [],
};

export default function CreatorApp({ mode = 'legacy', orgUUID }: { mode?: 'legacy' | 'org'; orgUUID?: string } = {}) {
  // mode:
  // - 'legacy': uses slug-based endpoints (/api/boards/:slug) for load/save/update/delete
  // - 'org': create boards under a specific organization via POST /api/v1/organizations/{orgUUID}/boards;
  //          patch/delete by slug are disabled to avoid non-UUID routing. This reuses the same grid UI.
  const [store, setStore] = useState<Store>(defaultStore);
  const [loaded, setLoaded] = useState(false);

  // UI state for in-progress selection
  const [currentLabel, setCurrentLabel] = useState("");
  const [currentColor, setCurrentColor] = useState("#0ea5e9"); // sky-500
  const [selection, setSelection] = useState<Set<TileId>>(new Set());
  const [overrideMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAnchor, setDragAnchor] = useState<{ r: number; c: number } | null>(null);
  const [dragHover, setDragHover] = useState<{ r: number; c: number } | null>(null);

  // Brush mode: click an area in the list to paint tiles with that area
  const [brushAreaId, setBrushAreaId] = useState<string | null>(null);
  const [painting, setPainting] = useState(false);

  // Fit grid to available viewport height without overflow; compute cell size
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [cellSize, setCellSize] = useState<{ w: number; h: number }>({ w: 24, h: 24 });

  // Load initial state — start with a new empty board by default
  useEffect(() => {
    setStore({ version: 1, slug: "", rows: 0, cols: 0, areas: [] })
    setLoaded(true)
  }, []);

  // Persist
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, loaded]);

  // Load from server if ?load=slug is present
  const searchParams = useSearchParams();
  useEffect(() => {
    const boardUUID = searchParams?.get('board')
    if (mode === 'org') {
      if (!boardUUID || !orgUUID) return
      ;(async () => {
        try {
          const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards/${encodeURIComponent(boardUUID)}`, { headers: { 'X-Organization-UUID': orgUUID }, cache: 'no-store' })
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error?.message || data?.error || 'Load failed')
          setStore({ version: 1, slug: data.slug || '', rows: Number(data.rows) || 0, cols: Number(data.cols) || 0, areas: Array.isArray(data.areas) ? data.areas : [] })
        } catch (e) { console.error(e) }
      })()
      return
    }
    // legacy slug loader
    const slug = searchParams?.get("load");
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/boards/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Load failed");
        setStore({
          version: 1,
          slug: data.slug || slug,
          rows: Number(data.rows) || 0,
          cols: Number(data.cols) || 0,
          areas: Array.isArray(data.areas) ? data.areas : [],
        });
      } catch (e) {
        // keep local state if load fails
        console.error(e);
      }
    })();
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived mapping: tile -> area
  const tileToArea = useMemo(() => {
    const m = new Map<TileId, Area>();
    for (const a of store.areas) {
      for (const t of a.tiles) m.set(t, a);
    }
    return m;
  }, [store.areas]);

  // Helpers
  const tileId = useCallback((r: number, c: number) => `${r}-${c}`, []);
  const parseTile = useCallback((id: TileId) => {
    const [rs, cs] = id.split("-")
    return { r: Number(rs) || 0, c: Number(cs) || 0 }
  }, []);

  // Compute tiles within a rectangle defined by two corners (inclusive)
  const rectTiles = useCallback((a: { r: number; c: number }, b: { r: number; c: number }) => {
    const r1 = Math.min(a.r, b.r);
    const r2 = Math.max(a.r, b.r);
    const c1 = Math.min(a.c, b.c);
    const c2 = Math.max(a.c, b.c);
    const out: TileId[] = [];
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) out.push(tileId(r, c));
    }
    return out;
  }, [tileId]);

  // Set of tiles currently under drag rectangle
  const dragSet = useMemo(() => {
    if (!isDragging || !dragAnchor || !dragHover) return new Set<TileId>();
    return new Set(rectTiles(dragAnchor, dragHover));
  }, [isDragging, dragAnchor, dragHover, rectTiles]);

  // Finalize brush or rectangle selection on mouseup anywhere
  useEffect(() => {
    function onUp() {
      if (painting) {
        setPainting(false);
        return;
      }
      if (!isDragging) return;
      setSelection(prev => {
        const next = new Set(prev);
        for (const id of dragSet) {
          if (!overrideMode && tileToArea.has(id)) continue;
          next.add(id);
        }
        return next;
      });
      setIsDragging(false);
      setDragAnchor(null);
      setDragHover(null);
    }
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [isDragging, dragSet, overrideMode, tileToArea, painting]);


  const clearSelection = useCallback(() => setSelection(new Set()), []);

  const commitArea = useCallback(() => {
    const tiles = Array.from(selection);
    const label = currentLabel.trim();
    if (!label || tiles.length === 0) return;

    setStore(s => {
      // Build map based on current state
      const map = new Map<TileId, Area>();
      for (const a of s.areas) for (const t of a.tiles) map.set(t, a);

      let areas = s.areas.map(a => ({ ...a, tiles: [...a.tiles] }));

      if (overrideMode) {
        // Remove selected tiles from any existing areas
        for (const a of areas) {
          a.tiles = a.tiles.filter(t => !selection.has(t));
        }
        areas = areas.filter(a => a.tiles.length > 0);
      }

      // If strict mode, filter out tiles already assigned
      const finalTiles = overrideMode ? tiles : tiles.filter(t => !map.has(t));
      if (finalTiles.length === 0) return s; // nothing to add

      const area: Area = { id: uid(), label, color: currentColor, tiles: finalTiles };
      return { ...s, areas: [...areas, area] };
    });

    setCurrentLabel("");
    clearSelection();
  }, [selection, currentLabel, currentColor, overrideMode, clearSelection]);

  const removeArea = useCallback((id: string) => {
    setStore(s => ({ ...s, areas: s.areas.filter(a => a.id !== id) }));
  }, []);

  // Apply brush to a single tile (override existing)
  const applyBrushTo = useCallback((r: number, c: number) => {
    if (!brushAreaId) return;
    const t = tileId(r, c)
    setStore(s => {
      const idx = s.areas.findIndex(a => a.id === brushAreaId)
      if (idx === -1) return s
      let changed = false
      const newAreas = s.areas.map(a => {
        if (a.tiles.includes(t)) {
          changed = true
          return { ...a, tiles: a.tiles.filter(x => x !== t) }
        }
        return a
      })
      const target = newAreas[idx]
      if (!target.tiles.includes(t)) {
        const nt = { ...target, tiles: [...target.tiles, t] }
        newAreas[idx] = nt
        changed = true
      }
      return changed ? { ...s, areas: newAreas } : s
    })
  }, [brushAreaId, tileId])

  const applyGrid = useCallback((rows: number, cols: number) => {
    // Keep existing areas; clamp tiles to new bounds
    setStore(s => {
      const nr = Math.max(1, Math.min(100, rows));
      const nc = Math.max(1, Math.min(100, cols));
      const newAreas = s.areas.map(a => {
        const kept = a.tiles.filter(t => {
          const { r, c } = parseTile(t)
          return r >= 0 && r < nr && c >= 0 && c < nc
        })
        return { ...a, tiles: kept }
      })
      return { ...s, rows: nr, cols: nc, areas: newAreas }
    })
    setSelection(prev => {
      const next = new Set<TileId>()
      for (const t of prev) {
        const { r, c } = parseTile(t)
        if (r >= 0 && r < rows && c >= 0 && c < cols) next.add(t)
      }
      return next
    })
  }, [parseTile]);

  // Resize observer for fitting grid
  useEffect(() => {
    function recompute() {
      const el = wrapRef.current
      if (!el || store.cols <= 0 || store.rows <= 0) return
      const availW = el.clientWidth
      const availH = el.clientHeight
      const gap = 1 // px, must match CSS gap
      const cw = Math.max(4, Math.floor((availW - (store.cols - 1) * gap) / store.cols))
      const ch = Math.max(4, Math.floor((availH - (store.rows - 1) * gap) / store.rows))
      setCellSize({ w: cw, h: ch })
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', recompute)
    return () => {
      try { ro.disconnect() } catch {}
      window.removeEventListener('resize', recompute)
    }
  }, [store.cols, store.rows])

  // UI
  return (
    <div className="space-y-6">
      {/* Controls — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Column 1 */}
        <div className="flex flex-col gap-2 p-3 border border-black/10 rounded">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Slug</label>
            <input
              className="border border-black/20 rounded px-2 py-1"
              value={store.slug}
              onChange={e => setStore(s => ({ ...s, slug: e.target.value }))}
              placeholder="board-slug"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Rows</label>
            <input
              type="number"
              min={1}
              max={100}
              className="border border-black/20 rounded px-2 py-1"
              value={store.rows}
              onChange={e => {
                const v = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                applyGrid(v, store.cols)
              }}
              id="creator-rows"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Cols</label>
            <input
              type="number"
              min={1}
              max={100}
              className="border border-black/20 rounded px-2 py-1"
              value={store.cols}
              onChange={e => {
                const v = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                applyGrid(store.rows, v)
              }}
              id="creator-cols"
            />
          </div>
          <button
            className="h-8 px-3 rounded bg-[--color-brand] text-white"
            onClick={() => {
              // No-op: rows/cols are applied immediately
              applyGrid(store.rows, store.cols);
            }}
          >apply</button>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-2 p-3 border border-black/10 rounded">
          {/* New: Area editor (select existing, edit label/color, apply) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Select defined label</label>
            <select
              className="border border-black/20 rounded px-2 py-1"
              value={brushAreaId || ''}
              onChange={e => {
                const id = e.target.value || null
                setBrushAreaId(id)
                if (!id) return
                const a = store.areas.find(x => x.id === id)
                if (a) {
                  setCurrentLabel(a.label)
                  setCurrentColor(a.color)
                  // Load tiles into selection for editing (replace selection)
                  setSelection(new Set(a.tiles))
                }
              }}
            >
              <option value="">(none)</option>
              {store.areas.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">label</label>
            <input
              className="border border-black/20 rounded px-2 py-1"
              placeholder="e.g. Main Section"
              value={currentLabel}
              onChange={e => setCurrentLabel(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Color</label>
            <input
              type="color"
              value={currentColor}
              onChange={e => setCurrentColor(e.target.value)}
              className="h-9 w-12 p-0 border border-black/20 rounded"
              title="Select selection color"
            />
          </div>
          <div className="text-sm">
            <span className="opacity-70 mr-2">label preview</span>
            <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: currentColor }}>
              #{slugify(currentLabel || "label")}
            </span>
          </div>

          {/* Apply locally: update selected area fields and (optionally) its tiles with current selection */}
          <button
            className="h-8 px-3 rounded bg-emerald-600 text-white disabled:opacity-50"
            disabled={!currentLabel.trim() || !brushAreaId}
            onClick={() => {
              if (!brushAreaId) return
              const label = currentLabel.trim()
              setStore(s => {
                const idx = s.areas.findIndex(a => a.id === brushAreaId)
                if (idx === -1) return s
                const updated = [...s.areas]
                const prev = updated[idx]
                updated[idx] = { ...prev, label, color: currentColor, tiles: Array.from(selection) }
                return { ...s, areas: updated }
              })
            }}
          >apply (local)</button>


          {/* Legacy add-area (create new label from selection) */}
          <button
            className="h-8 px-3 rounded bg-neutral-700 text-white disabled:opacity-50"
            disabled={!currentLabel.trim() || selection.size === 0}
            onClick={commitArea}
          >add new label from selection</button>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-2 p-3 border border-black/10 rounded">
          <button
            className="h-8 px-3 rounded border border-black/20"
            onClick={() => {
              const ok = confirm("Clear the grid (remove all areas)?");
              if (!ok) return;
              setStore(s => ({ ...s, areas: [] }));
              clearSelection();
            }}
          >clear</button>
          {/* Create/Save board: org-scoped (uuid) only. */}
          <button
            className="h-8 px-3 rounded bg-blue-600 text-white"
            onClick={async () => {
              const slug = (store.slug || "").trim();
              const rows = Number(store.rows) || 0
              const cols = Number(store.cols) || 0
              if (!slug) { alert("Set a slug before creating."); return; }
              if (rows <= 0 || cols <= 0) { alert("Set rows and cols before creating."); return; }
              try {
                if (mode === 'org') {
                  if (!orgUUID) { alert('Missing organization UUID'); return }
                      const boardUUID = searchParams?.get('board')
if (boardUUID) {
                    // PATCH existing board (disallow saving empty areas)
                    if (!Array.isArray(store.areas) || store.areas.length === 0) { alert('Cannot save a board with no areas. Delete the board instead.'); return }
                    const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards/${encodeURIComponent(boardUUID)}`, {
                      method: 'PATCH',
                      headers: { 'content-type': 'application/json', 'X-Organization-UUID': orgUUID },
                      body: JSON.stringify({ slug, rows, cols, areas: store.areas })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data?.error?.message || data?.error || 'Save failed')
                    try { const bc = new BroadcastChannel('cardmass'); bc.postMessage({ type: 'board:updated' }); bc.close() } catch {}
                    // Redirect to organization board list (requested behavior)
                    window.location.assign(`/${encodeURIComponent(orgUUID)}`)
                  } else {
// CREATE new board (require at least one area)
                    if (!Array.isArray(store.areas) || store.areas.length === 0) { alert('Define at least one area before creating this board.'); return }
                    const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/boards`, {
                      method: "POST",
                      headers: { "content-type": "application/json", 'X-Organization-UUID': orgUUID },
                      body: JSON.stringify({ slug, rows, cols, areas: store.areas }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error?.message || data?.error || "Create failed");
                    try { const bc = new BroadcastChannel('cardmass'); bc.postMessage({ type: 'board:created' }); bc.close() } catch {}
                    // Redirect to organization board list (requested behavior)
                    window.location.assign(`/${encodeURIComponent(orgUUID)}`)
                  }
                }
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Create failed. Check MONGODB_URI in .env.local";
                alert(msg);
              }
            }}
          >{mode === 'org' ? (searchParams?.get('board') ? 'Save' : 'Create') : 'save'}</button>
        </div>
      </div>

      {/* Current label hashtag preview */}
      <div className="text-sm flex items-center gap-2">
        <span className="opacity-70">Hashtag:</span>
        <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: currentColor }}>
          #{slugify(currentLabel || "label")}
        </span>
        <span className="opacity-50">(preview)</span>
      </div>

      {/* Grid */}
      {store.rows > 0 && store.cols > 0 && (
      <div ref={wrapRef} className="border border-black/20 rounded relative" style={{ height: 'calc(100dvh - 320px)' }}>
        <div
          className="grid absolute inset-0 overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${store.cols}, ${cellSize.w}px)`,
            gridAutoRows: `${cellSize.h}px`,
            placeContent: 'center',
            gap: '1px'
          }}
        >
          {Array.from({ length: store.rows }, (_, r) => r).map(r => (
            Array.from({ length: store.cols }, (_, c) => c).map(c => {
              const id = tileId(r, c);
              const assigned = tileToArea.get(id);
              const inDrag = dragSet.has(id);
              const isPersistSel = selection.has(id);
              const baseTint = `rgba(${parseInt(currentColor.slice(1,3),16)}, ${parseInt(currentColor.slice(3,5),16)}, ${parseInt(currentColor.slice(5,7),16)}, 0.25)`;
              const bg = assigned ? assigned.color : baseTint;
              const borderColor = (isPersistSel || inDrag) ? currentColor : "#e5e7eb"; // gray-200
              return (
                <button
                  key={id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (brushAreaId) {
                      setPainting(true);
                      applyBrushTo(r, c);
                      return;
                    }
                    setIsDragging(true);
                    setDragAnchor({ r, c });
                    setDragHover({ r, c });
                  }}
                  onMouseEnter={() => {
                    if (painting && brushAreaId) { applyBrushTo(r, c); return; }
                    if (isDragging) setDragHover({ r, c });
                  }}
                  className={`relative block w-full h-full border select-none ${brushAreaId ? 'cursor-crosshair' : ''}`}
                  style={{ backgroundColor: bg, borderColor }}
                  title={assigned ? `#${slugify(assigned.label)} (${assigned.color})` : id}
                >
                  {assigned && (
<span
                      className="absolute bottom-1 left-1 text-[10px] px-1 rounded"
                      style={{ backgroundColor: assigned.color, color: (assigned as Area).textBlack !== false ? '#000' : '#fff' }}
                    >#{slugify(assigned.label)}</span>
                  )}
                </button>
              );
            })
          ))}
        </div>
      </div>
      )}

      {/* Areas list */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Areas</div>
        {store.areas.length === 0 ? (
          <div className="text-sm opacity-70">No areas yet. Select tiles, set label & color, then Commit area.</div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-2">
            {store.areas.map(a => (
              <li
                key={a.id}
                className={`border rounded p-2 flex items-center justify-between ${brushAreaId === a.id ? 'border-blue-500 ring-1 ring-blue-400' : 'border-black/10'}`}
                onClick={() => setBrushAreaId(prev => prev === a.id ? null : a.id)}
                title={brushAreaId === a.id ? 'Brush active: click to turn off' : 'Click to use as brush'}
              >
                <div className="flex items-center gap-2">
<span className="px-2 py-0.5 rounded" style={{ backgroundColor: a.color, color: (a.textBlack !== false) ? '#000' : '#fff' }}>
                    #{slugify(a.label)}
                  </span>
                  <span className="text-xs opacity-70">{a.tiles.length} tile(s)</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs flex items-center gap-1" onClick={(e)=>e.stopPropagation()}>
                    <input type="checkbox" checked={a.textBlack !== false} onChange={(e)=>{
                      e.stopPropagation();
                      setStore(s => {
                        const idx = s.areas.findIndex(x => x.id === a.id)
                        if (idx === -1) return s
                        const updated = [...s.areas]
                        updated[idx] = { ...updated[idx], textBlack: e.target.checked }
                        return { ...s, areas: updated }
                      })
                    }} />
                    <span>BLACK text</span>
                  </label>
                  <button className="text-red-600 text-sm" onClick={(e) => { e.stopPropagation(); removeArea(a.id) }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
