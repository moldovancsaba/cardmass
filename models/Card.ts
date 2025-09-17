import mongoose, { Schema, model, models } from 'mongoose'
import { randomUUID } from 'node:crypto'

// Card model encapsulates the core domain entity used in the UI columns.
// Why mongoose timestamps: ensures consistent createdAt/updatedAt in UTC Dates,
// which we later serialize as ISO 8601 with milliseconds for the UI and docs.

export type CardStatus =
  | 'delegate' | 'decide' | 'do' | 'decline'
  | 'bmc:key_partners' | 'bmc:key_activities' | 'bmc:key_resources' | 'bmc:value_propositions'
  | 'bmc:customer_relationships' | 'bmc:channels' | 'bmc:customer_segments'
  | 'bmc:cost_structure' | 'bmc:revenue_streams'

export interface CardDoc extends mongoose.Document {
  text: string
  uuid?: string
  status: CardStatus
  order: number // relative position within its status group; lower comes first
  business: 'KeyPartners' | 'KeyActivities' | 'KeyResources' | 'ValuePropositions' | 'CustomerRelationships' | 'Channels' | 'CustomerSegments' | 'Cost' | 'RevenueStream'
  businessOrder: number
  archived?: boolean
  archivedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const CardSchema = new Schema<CardDoc>(
  {
    text: { type: String, required: true, trim: true },
    // Public shareable identifier. A random v4 UUID assigned on creation.
    uuid: { type: String, default: () => randomUUID() },
    // Status values include classic kanban/matrix and Business Model Canvas buckets.
    status: {
      type: String,
      enum: [
        'delegate', 'decide', 'do', 'decline',
        'bmc:key_partners', 'bmc:key_activities', 'bmc:key_resources', 'bmc:value_propositions',
        'bmc:customer_relationships', 'bmc:channels', 'bmc:customer_segments',
        'bmc:cost_structure', 'bmc:revenue_streams'
      ],
      default: 'decide',
      index: true
    },
    // Numeric ordering supports stable drag-and-drop reordering without full reindex.
    // We use fractional insertion (avg of neighbors) on the client; normalization can be added later.
    order: { type: Number, required: true, default: 0, index: true },
    // Business classification used for /business layout; default all cards to ValuePropositions.
    business: { type: String, enum: ['KeyPartners', 'KeyActivities', 'KeyResources', 'ValuePropositions', 'CustomerRelationships', 'Channels', 'CustomerSegments', 'Cost', 'RevenueStream'], default: 'ValuePropositions', index: true },
    businessOrder: { type: Number, required: true, default: 0, index: true },
    archived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Helpful indexes for common sort/filter
CardSchema.index({ updatedAt: -1 })
CardSchema.index({ archivedAt: -1 })
CardSchema.index({ status: 1, order: 1 })
CardSchema.index({ business: 1, businessOrder: 1 })
// Unique sparse index so existing docs without uuid don't break; migration will backfill.
CardSchema.index({ uuid: 1 }, { unique: true, sparse: true })

// Transform Mongo fields to API-friendly JSON
CardSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    if (ret._id) {
      ret.id = ret._id.toString()
      delete ret._id
    }
    // Ensure ISO 8601 with milliseconds
    if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString()
    if (ret.updatedAt instanceof Date) ret.updatedAt = ret.updatedAt.toISOString()
    if (ret.archivedAt instanceof Date) ret.archivedAt = ret.archivedAt.toISOString()
    return ret
  },
})

export const Card = models.Card || model<CardDoc>('Card', CardSchema)
