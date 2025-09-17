"use client"

import { useRouter } from 'next/navigation'
import BottomBar from '@/components/BottomBar'

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
      showProof={true}
      showAdmin={true}
      onArchiveNav={() => router.push('/archive')}
      onKanbanNav={() => router.push('/kanban')}
      onMatrixNav={() => router.push('/matrix')}
      onBusinessNav={() => router.push('/business')}
      onProofNav={() => router.push('/proof')}
      onAdminNav={() => router.push('/admin')}
    />
  )
}