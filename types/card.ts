export type Card = {
  id: string
  text: string
  status: 'delegate' | 'decide' | 'do' | 'decline'
  order: number
  archived?: boolean
  archivedAt?: string
  createdAt: string // ISO 8601 with milliseconds UTC
  updatedAt: string // ISO 8601 with milliseconds UTC
}
