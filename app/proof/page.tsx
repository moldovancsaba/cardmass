import Board from '@/components/Board'

export default function ProofPage() {
  return (
    <main className="p-4 bg-white text-black flex flex-col xl:h-screen xl:overflow-hidden">
      <div className="flex-1 xl:overflow-hidden">
<Board initialView="matrix" axisHidden={true} titleOverrides={{ do: '#persona', decide: '#proposal', delegate: '#journey', decline: '#backlog' }} createDefaultStatus={'decline'} />
      </div>
    </main>
  )
}
