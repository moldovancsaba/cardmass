"use client"

import { useState } from 'react'

type Props = {
  disabled?: boolean // disables the input only; nav remains active
  view?: 'kanban' | 'matrix'
  onCreate?: (text: string) => Promise<void>
  onToggle?: () => void
  onArchiveNav?: () => void
  onKanbanNav?: () => void
  onMatrixNav?: () => void
  showToggle?: boolean
  showArchive?: boolean
  showKanban?: boolean
  showMatrix?: boolean
}

export default function BottomBar({ disabled = false, view = 'kanban', onCreate, onToggle, onArchiveNav, onKanbanNav, onMatrixNav, showToggle = true, showArchive = true, showKanban = false, showMatrix = false }: Props) {
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
    <div className="mt-3 bg-white border border-gray-300 rounded-md p-2 flex items-center gap-2 shrink-0">
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
        {showKanban && (
          <button onClick={() => onKanbanNav && onKanbanNav()} className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black">
            kanban
          </button>
        )}
        {showMatrix && (
          <button onClick={() => onMatrixNav && onMatrixNav()} className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black">
            matrix
          </button>
        )}
        {showArchive && (
          <button onClick={() => onArchiveNav && onArchiveNav()} className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black">
            archive
          </button>
        )}
        {showToggle && (
          <button onClick={() => onToggle && onToggle()} className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black">
            {toggleLabel}
          </button>
        )}
      </div>
    </div>
  )
}
