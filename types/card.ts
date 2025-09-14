export type Card = {
  id: string
  text: string
  status:
    | 'delegate' | 'decide' | 'do' | 'decline'
    | 'bmc:key_partners' | 'bmc:key_activities' | 'bmc:key_resources' | 'bmc:value_propositions'
    | 'bmc:customer_relationships' | 'bmc:channels' | 'bmc:customer_segments'
    | 'bmc:cost_structure' | 'bmc:revenue_streams'
  order: number
  // Business classification for /business layout
  business?: 'ValuePropositions' | 'KeyActivities' | 'KeyResources'
  businessOrder?: number
  archived?: boolean
  archivedAt?: string
  createdAt: string // ISO 8601 with milliseconds UTC
  updatedAt: string // ISO 8601 with milliseconds UTC
}
