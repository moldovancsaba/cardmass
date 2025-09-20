"use client"

import SPOCK from '@/components/SPOCK'

type Props = { disabled: boolean; boardSlug: string; boardSlugs: string[] }

export default function SpockBar({ disabled, boardSlug, boardSlugs }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 h-[96px]">
      <div className="p-2 h-full w-full flex items-center">
        <SPOCK
          // What: SPOCK bottom bar is the primary navigation for boards and admin.
          // Why: Aligns with policy: no breadcrumbs; clear, direct top-level navigation.
          disabled={disabled}
          // New: pass boards for direct navigation; limit handled in component
          boardLinks={boardSlugs}
          currentBoard={boardSlug}
          maxVisibleBoards={3}
          onAdminNav={() => { try { window.location.href = '/admin' } catch {} }}
          onCreate={async (text) => {
            if (disabled) return
            const res = await fetch('/api/cards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // Do not persist 'spock' — spock is a virtual inbox, not a stored label
              body: JSON.stringify({ text, status: 'decide', boardSlug }),
            })
            if (res.ok) {
              try { window.dispatchEvent(new CustomEvent('card:created')) } catch {}
              try { const bc = new BroadcastChannel('cardmass'); bc.postMessage({ type: 'card:created' }); bc.close() } catch {}
            }
          }}
        />
      </div>
    </div>
  )
}
