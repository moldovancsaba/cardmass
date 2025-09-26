"use client"

export default function CardActions({ orgUUID, cardUUID, initialText }: { orgUUID: string; cardUUID: string; initialText: string }) {
  async function onEdit() {
    const next = (prompt('Edit card', initialText) || '').trim()
    if (!next || next === initialText) return
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(cardUUID)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Organization-UUID': orgUUID },
        body: JSON.stringify({ text: next })
      })
      if (!res.ok) throw new Error(await res.text())
      try { window.dispatchEvent(new CustomEvent('card:updated')) } catch {}
      try { const bc = new BroadcastChannel('cardmass'); bc.postMessage({ type: 'card:updated' }); bc.close() } catch {}
      try { window.location.reload() } catch {}
    } catch (e) { alert(e instanceof Error ? e.message : 'Edit failed') }
  }

  async function onDelete() {
    const ok = confirm('Delete this card?')
    if (!ok) return
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(orgUUID)}/cards/${encodeURIComponent(cardUUID)}`, {
        method: 'DELETE',
        headers: { 'X-Organization-UUID': orgUUID }
      })
      if (!res.ok) throw new Error(await res.text())
      try { window.dispatchEvent(new CustomEvent('card:deleted')) } catch {}
      try { const bc = new BroadcastChannel('cardmass'); bc.postMessage({ type: 'card:deleted' }); bc.close() } catch {}
      try { window.location.assign(`/${encodeURIComponent(orgUUID)}`) } catch {}
    } catch (e) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={onEdit} className="px-3 py-1 text-sm rounded bg-black text-white">Edit</button>
      <button onClick={onDelete} className="px-3 py-1 text-sm rounded bg-red-600 text-white">Delete</button>
    </div>
  )
}
