"use client"

import { useState } from 'react'

type Props = {
  disabled?: boolean
  view?: 'kanban' | 'matrix'
  onCreate?: (text: string) => Promise<void>
  onToggle?: () => void
  onArchiveNav?: () => void
}

export default function BottomBar({ disabled = false, view = 'kanban', onCreate, onToggle, onArchiveNav }: Props) {
  const [value, setValue] = useState('')

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

  const toggleLabel = view === 'kanban' ? 'matrix' : 'kanban'

  return (
    <div className="sticky bottom-0 mt-3 bg-white border border-gray-300 rounded-md p-2 flex items-center gap-2">
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
      <div className="flex items-center gap-2">
        <button
          onClick={() => { if (!disabled && onArchiveNav) onArchiveNav() }}
          className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black disabled:opacity-50"
          disabled={disabled}
        >
          archive
        </button>
        <button
          onClick={() => { if (!disabled && onToggle) onToggle() }}
          className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black disabled:opacity-50"
          disabled={disabled}
        >
          {toggleLabel}
        </button>
      </div>
    </div>
  )
}
