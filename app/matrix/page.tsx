import Board from '@/components/Board'

export default function MatrixPage() {
  return (
    <main className="min-h-screen p-4 bg-white text-black">
      <Board initialView="matrix" />
    </main>
  )
}
