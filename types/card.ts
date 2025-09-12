export type Card = {
  id: string
  text: string
  status: 'roadmap' | 'backlog' | 'todo'
  createdAt: string // ISO 8601 with milliseconds UTC
  updatedAt: string // ISO 8601 with milliseconds UTC
}
