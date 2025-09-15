import mongoose, { Schema, model, models } from 'mongoose'

export interface ShareDoc extends mongoose.Document {
  uuid: string
  cardId: string
  text: string
  status: string
  business?: string
  createdAt: Date
  updatedAt: Date
}

const ShareSchema = new Schema<ShareDoc>({
  uuid: { type: String, required: true, index: true, unique: true },
  cardId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  status: { type: String, required: true },
  business: { type: String },
}, { timestamps: true })

ShareSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    if (ret._id) {
      delete ret._id
    }
    if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString()
    if (ret.updatedAt instanceof Date) ret.updatedAt = ret.updatedAt.toISOString()
    return ret
  },
})

export const Share = models.Share || model<ShareDoc>('Share', ShareSchema)
