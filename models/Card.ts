import mongoose, { Schema, model, models } from 'mongoose'

// Card model encapsulates the core domain entity used in the UI columns.
// Why mongoose timestamps: ensures consistent createdAt/updatedAt in UTC Dates,
// which we later serialize as ISO 8601 with milliseconds for the UI and docs.

export type CardStatus = 'roadmap' | 'backlog' | 'todo'

export interface CardDoc extends mongoose.Document {
  text: string
  status: CardStatus
  archived?: boolean
  archivedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const CardSchema = new Schema<CardDoc>(
  {
    text: { type: String, required: true, trim: true },
    status: { type: String, enum: ['roadmap', 'backlog', 'todo'], default: 'backlog', index: true },
    archived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Helpful indexes for common sort/filter
CardSchema.index({ updatedAt: -1 })
CardSchema.index({ archivedAt: -1 })

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
