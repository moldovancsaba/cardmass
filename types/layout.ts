import type { Card } from '@/types/card'

export type LayoutAdapter = {
  id: string
  title?: string
  // Rows define the grid: array of rows -> array of group ids per row
  grid: { rows: string[][] }
  groups: { id: string; title: string }[]
  // Query key to load cards per group: 'status' | 'business' | 'proof' | ...
  queryKey: string
  // Name of the order field used for sorting within a group
  orderField: 'order' | 'businessOrder' | 'proofOrder'
  // Extract the current group id from a card
  getGroup(card: Card): string | undefined
  // Compute PATCH body for moving card into a group with new order
  patchBody(groupId: string, order: number): Partial<Card>
  // Compute POST body defaults for creating a card within this layout
  createDefaults(): Partial<Card> & Record<string, unknown>
  // Palette for group chips and container background
  colors(settings: unknown, groupId: string): { bg: string; fg: string; bgSoft: string }
  // Optional extra chips to show per card
  extraChips?(card: Card): string[]
}
