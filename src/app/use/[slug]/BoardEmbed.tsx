"use client"

import Board from '@/components/Board'

export default function BoardEmbed({ boardSlug }: { boardSlug: string }) {
  return <Board boardSlug={boardSlug} initialView="kanban" />
}
