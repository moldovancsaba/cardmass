import { redirect } from 'next/navigation'
import { computeHashtagUUID } from '@/lib/hashtag'

export default async function ResolveHashtagPage({ params, searchParams }: { params: Promise<{ organizationUUID: string }>, searchParams: Promise<{ board?: string; label?: string }> }) {
  const { organizationUUID: org } = await params
  const { board, label } = await searchParams
  const boardKey = String(board || '').trim()
  const name = String(label || '').trim().toLowerCase()
  if (!org || !boardKey || !name) {
    redirect(`/${encodeURIComponent(org || '')}`)
  }
  const uuid = computeHashtagUUID(org, boardKey, name)
  redirect(`/${encodeURIComponent(org)}/hashtags/${encodeURIComponent(uuid)}`)
}
