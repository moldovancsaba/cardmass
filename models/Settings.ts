import mongoose, { Schema, model, models } from 'mongoose'

// Global settings for hashtag color rules
// Why a single-key doc: keeping a single global config simplifies MVP and avoids
// accidental duplication; can be extended to multi-tenant later by adding a tenant key.

export interface SettingsDoc extends mongoose.Document {
  key: string
  colors: {
    age: { oldest: string; newest: string }
    rotten: { least: string; most: string }
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
