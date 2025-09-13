import BusinessCanvas from '@/components/BusinessCanvas'

export default function BusinessPage() {
  return (
    <main className="p-4 bg-white text-black flex flex-col xl:h-screen xl:overflow-hidden">
      <div className="flex-1 xl:overflow-hidden">
        <BusinessCanvas />
      </div>
    </main>
  )
}
