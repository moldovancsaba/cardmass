import mongoose, { Schema, model, models } from 'mongoose'

// Global settings for hashtag color rules
// Why a single-key doc: keeping a single global config simplifies MVP and avoids
// accidental duplication; can be extended to multi-tenant later by adding a tenant key.

export interface SettingsDoc extends mongoose.Document {
  key: string
  colors: {
    age: { oldest: string; newest: string }
    rotten: { least: string; most: string }
    archive: { oldest: string; newest: string }
  }
  business: {
    key_partners: string
    key_activities: string
    key_resources: string
    value_propositions: string
    customer_relationships: string
    channels: string
    customer_segments: string
    cost_structure: string
    revenue_streams: string
  }
  createdAt: Date
  updatedAt: Date
}

const SettingsSchema = new Schema<SettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    colors: {
      age: {
        oldest: { type: String, required: true, default: '#0a3d91' },
        newest: { type: String, required: true, default: '#9ecbff' },
      },
      rotten: {
        least: { type: String, required: true, default: '#2ecc71' },
        most: { type: String, required: true, default: '#8e5b3a' },
      },
      archive: {
        oldest: { type: String, required: true, default: '#6b7280' }, // gray-600
        newest: { type: String, required: true, default: '#d1d5db' }, // gray-300
      },
    },
    business: {
      key_partners: { type: String, required: true, default: 'Key Partners' },
      key_activities: { type: String, required: true, default: 'Key Activities' },
      key_resources: { type: String, required: true, default: 'Key Resources' },
      value_propositions: { type: String, required: true, default: 'Value Propositions' },
      customer_relationships: { type: String, required: true, default: 'Customer Relationships' },
      channels: { type: String, required: true, default: 'Channels' },
      customer_segments: { type: String, required: true, default: 'Customer Segments' },
      cost_structure: { type: String, required: true, default: 'Cost Structure' },
      revenue_streams: { type: String, required: true, default: 'Revenue Streams' },
    },
  },
  { timestamps: true }
)

SettingsSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString?.()
    delete ret._id
    if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString()
    if (ret.updatedAt instanceof Date) ret.updatedAt = ret.updatedAt.toISOString()
    return ret
  },
})

export const Settings = models.Settings || model<SettingsDoc>('Settings', SettingsSchema)
