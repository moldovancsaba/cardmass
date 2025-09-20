"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Props = {
  // Functional: creation
  disabled?: boolean // disables the input only; nav remains active
  onCreate?: (text: string) => Promise<void>

  // Navigation (legacy toggles retained for type compatibility but not rendered)
  onAdminNav?: () => void

  // SPOCK board navigation (new)
  boardLinks?: string[] // list of board slugs for direct navigation
  currentBoard?: string // active board slug for highlight
  maxVisibleBoards?: number // default 3
}

export default function BottomBar({ disabled = false, onCreate, onAdminNav, boardLinks = [], currentBoard, maxVisibleBoards = 3 }: Props) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Close overflow on outside click / Escape for accessibility
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const text = value.trim()
      if (!text || !onCreate) return
      await onCreate(text)
      setValue('')
    }
  }

  const sorted = [...(boardLinks || [])].sort((a, b) => a.localeCompare(b))
  const visible = sorted.slice(0, Math.max(0, maxVisibleBoards))
  const overflow = sorted.slice(Math.max(0, maxVisibleBoards))

  return (
    <div className="mt-3 w-full bg-white border border-gray-300 rounded-md p-2 flex items-center gap-2 shrink-0 xl:mt-2">
      {/* Card creation input (unchanged) */}
      <div className="flex-1">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a card and press Enter"
          className="w-full resize-none outline-none bg-white text-black min-h-[48px] disabled:opacity-50"
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="text-[10px] text-gray-500 mt-1">Enter to create • Shift+Enter for newline</div>
      </div>

      {/* Navigation group: boards (max 3) + overflow + Admin */}
      <div className="flex items-center gap-2">
        {/* Direct board links */}
        {visible.map((slug) => (
          <Link
            key={slug}
            href={`/use/${encodeURIComponent(slug)}`}
            aria-current={slug === currentBoard ? 'page' : undefined}
            className={`border border-gray-300 rounded px-3 py-1 text-sm ${slug === currentBoard ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5'}`}
          >
            {slug}
          </Link>
        ))}

        {/* Overflow hamburger for remaining boards */}
        {overflow.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls="spock-board-overflow"
              aria-label="More boards"
              onClick={() => setOpen((v) => !v)}
              className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black hover:bg-black/5"
            >
              ☰
            </button>
            {open && (
              <div
                role="menu"
                id="spock-board-overflow"
                className="absolute right-0 bottom-full mb-2 z-50 bg-white border border-gray-300 rounded shadow-md max-h-[50dvh] overflow-auto min-w-[160px]"
              >
                <ul className="py-1">
                  {sorted.map((slug) => (
                    <li key={`ov-${slug}`} role="none">
                      <Link
                        role="menuitem"
                        href={`/use/${encodeURIComponent(slug)}`}
                        aria-current={slug === currentBoard ? 'page' : undefined}
                        className={`block px-3 py-1 text-sm hover:bg-black/5 ${slug === currentBoard ? 'font-semibold' : ''}`}
                        onClick={() => setOpen(false)}
                      >
                        {slug}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Admin link */}
        <button onClick={() => onAdminNav && onAdminNav()} className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black hover:bg-black/5">
          admin
        </button>
      </div>
    </div>
  )
}
