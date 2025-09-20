"use client"

import { useRouter } from 'next/navigation'
import BottomBar from './BottomBar'

export default function FooterNav() {
  const router = useRouter()
  return (
    <BottomBar
      disabled
      view="kanban"
      showToggle={false}
      showArchive={true}
      showKanban={true}
      showMatrix={true}
      showBusiness={true}
      showAdmin={true}
      onArchiveNav={() => router.push('/archive')}
      onKanbanNav={() => router.push('/kanban')}
      onMatrixNav={() => router.push('/matrix')}
      onBusinessNav={() => router.push('/business')}
      onAdminNav={() => router.push('/admin')}
    />
  )
}