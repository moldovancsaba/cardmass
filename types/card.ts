export type Card = {
  id: string
  text: string
  status: 'roadmap' | 'backlog' | 'todo'
  archived?: boolean
  archivedAt?: string
  createdAt: string // ISO 8601 with milliseconds UTC
  updatedAt: string // ISO 8601 with milliseconds UTC
}
