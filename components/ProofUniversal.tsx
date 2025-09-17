"use client"

import UniversalBoard from '@/components/UniversalBoard'
import type { LayoutAdapter } from '@/types/layout'
import { useSettings } from '@/lib/settings'
import type { Card } from '@/types/card'

// Proof adapter for UniversalBoard: 2x2, groups are proof buckets
export default function ProofUniversal() {
  const settings = useSettings()
  const adapter: LayoutAdapter = {
    id: 'proof',
    title: 'Proof',
    grid: { rows: [['Persona', 'Proposal'], ['Journey', 'Backlog']] },
    groups: [
      { id: 'Persona', title: '#persona' },
      { id: 'Proposal', title: '#proposal' },
      { id: 'Journey', title: '#journey' },
      { id: 'Backlog', title: '#backlog' },
    ],
    queryKey: 'proof',
    orderField: 'proofOrder',
    getGroup: (card: Card) => (card.proof as string | undefined) ?? 'Backlog',
    patchBody: (groupId: string, order: number) => ({ proof: groupId as Card['proof'], proofOrder: order }),
    createDefaults: () => ({ status: 'decide', proof: 'Backlog' }),
    colors: (_s: unknown, gid: string) => {
      const key = gid.toLowerCase()
      const proofColors = (settings?.colors?.proof ?? {}) as Partial<Record<string,string>>
      const proofText = (settings?.colors?.textContrast?.proof ?? {}) as Partial<Record<string,boolean>>
      const bg = proofColors[key] || '#e5e7eb'
      const b = (proofText[key] ?? true) as boolean
      const fg = b ? '#000' : '#fff'
      const bgSoft = bg + '4D' // apx 30% alpha if hex
      return { bg, fg, bgSoft }
    },
    extraChips: (card: Card) => [
      `#${card.status}`,
      `#${((card as unknown as { business?: Card['business'] }).business ?? 'ValuePropositions')}`,
      `#${(((card as unknown as { proof?: Card['proof'] }).proof ?? 'Backlog') as string).toLowerCase()}`,
    ],
  }
  return <UniversalBoard adapter={adapter} />
}
