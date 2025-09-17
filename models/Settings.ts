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
    status: { delegate: string; decide: string; do: string; decline: string }
    matrixAxis: { important: string; not_important: string; urgent: string; not_urgent: string }
    businessBadges: {
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
    labels?: {
      archive: string
    }
    textContrast?: {
      status?: { delegate?: boolean; decide?: boolean; do?: boolean; decline?: boolean }
      matrixAxis?: { important?: boolean; not_important?: boolean; urgent?: boolean; not_urgent?: boolean }
      businessBadges?: {
        key_partners?: boolean
        key_activities?: boolean
        key_resources?: boolean
        value_propositions?: boolean
        customer_relationships?: boolean
        channels?: boolean
        customer_segments?: boolean
        cost_structure?: boolean
        revenue_streams?: boolean
      }
      labels?: { archive?: boolean }
      ranges?: { age?: boolean; rotten?: boolean; archive?: boolean }
    }
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
      status: {
        delegate: { type: String, required: true, default: '#93c5fd' },
        decide: { type: String, required: true, default: '#fde68a' },
        do: { type: String, required: true, default: '#86efac' },
        decline: { type: String, required: true, default: '#fca5a5' },
      },
      matrixAxis: {
        important: { type: String, required: true, default: '#93c5fd' },
        not_important: { type: String, required: true, default: '#bfdbfe' },
        urgent: { type: String, required: true, default: '#fca5a5' },
        not_urgent: { type: String, required: true, default: '#fecaca' },
      },
      // New color group for /proof layout; labels match the seven containers.
      proof: {
        persona: { type: String, required: true, default: '#e5e7eb' },
        proposal: { type: String, required: true, default: '#e5e7eb' },
        outcome: { type: String, required: true, default: '#e5e7eb' },
        benefit: { type: String, required: true, default: '#e5e7eb' },
        backlog: { type: String, required: true, default: '#e5e7eb' },
        journey: { type: String, required: true, default: '#e5e7eb' },
        validation: { type: String, required: true, default: '#e5e7eb' },
      },
      businessBadges: {
        key_partners: { type: String, required: true, default: '#e5e7eb' },
        key_activities: { type: String, required: true, default: '#e5e7eb' },
        key_resources: { type: String, required: true, default: '#e5e7eb' },
        value_propositions: { type: String, required: true, default: '#e5e7eb' },
        customer_relationships: { type: String, required: true, default: '#e5e7eb' },
        channels: { type: String, required: true, default: '#e5e7eb' },
        customer_segments: { type: String, required: true, default: '#e5e7eb' },
        cost_structure: { type: String, required: true, default: '#e5e7eb' },
        revenue_streams: { type: String, required: true, default: '#e5e7eb' },
      },
      labels: {
        archive: { type: String, required: true, default: '#e5e7eb' },
      },
      textContrast: {
        status: {
          delegate: { type: Boolean, default: true },
          decide: { type: Boolean, default: true },
          do: { type: Boolean, default: true },
          decline: { type: Boolean, default: true },
        },
        matrixAxis: {
          important: { type: Boolean, default: true },
          not_important: { type: Boolean, default: true },
          urgent: { type: Boolean, default: true },
          not_urgent: { type: Boolean, default: true },
        },
        businessBadges: {
          key_partners: { type: Boolean, default: true },
          key_activities: { type: Boolean, default: true },
          key_resources: { type: Boolean, default: true },
          value_propositions: { type: Boolean, default: true },
          customer_relationships: { type: Boolean, default: true },
          channels: { type: Boolean, default: true },
          customer_segments: { type: Boolean, default: true },
          cost_structure: { type: Boolean, default: true },
          revenue_streams: { type: Boolean, default: true },
        },
        labels: {
          archive: { type: Boolean, default: true },
        },
        ranges: {
          age: { type: Boolean, default: true },
          rotten: { type: Boolean, default: true },
          archive: { type: Boolean, default: true },
        },
        // Text contrast for proof chips in /proof layout
        proof: {
          persona: { type: Boolean, default: true },
          proposal: { type: Boolean, default: true },
          outcome: { type: Boolean, default: true },
          benefit: { type: Boolean, default: true },
          backlog: { type: Boolean, default: true },
          journey: { type: Boolean, default: true },
          validation: { type: Boolean, default: true },
        }
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
