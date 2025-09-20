import Board from '../../components/Board'

export default function KanbanPage() {
  return (
    <main className="p-4 bg-white text-black flex flex-col xl:h-screen xl:overflow-hidden">
      <div className="flex-1 xl:overflow-hidden">
        <Board initialView="kanban" />
      </div>
    </main>
  )
}
