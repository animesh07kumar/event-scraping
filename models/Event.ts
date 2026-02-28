import mongoose, { Document, Schema } from "mongoose"

export enum EventStatusTag {
  NEW = "new",
  UPDATED = "updated",
  INACTIVE = "inactive",
  IMPORTED = "imported",
}

export interface IEvent extends Document {
  title: string
  dateTime: Date
  venueName?: string
  venueAddress?: string
  city: string
  description?: string
  categoryTags: string[]
  imageUrl?: string
  sourceName: string
  originalUrl: string
  sourceKey: string
  contentHash: string
  statusTags: EventStatusTag[]
  lastScrapedAt: Date
  lastSeenAt: Date
  isActive: boolean
  imported: boolean
  importedAt?: Date
  importedBy?: string
  importNotes?: string
  createdAt?: Date
  updatedAt?: Date
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    dateTime: { type: Date, required: true },
    venueName: { type: String, trim: true },
    venueAddress: { type: String, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    categoryTags: { type: [String], default: [] },
    imageUrl: { type: String, trim: true },
    sourceName: { type: String, required: true, trim: true, index: true },
    originalUrl: { type: String, required: true, trim: true },
    sourceKey: { type: String, required: true, unique: true, index: true },
    contentHash: { type: String, required: true },
    statusTags: {
      type: [String],
      enum: Object.values(EventStatusTag),
      default: [EventStatusTag.NEW],
      index: true,
    },
    lastScrapedAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    imported: { type: Boolean, default: false, index: true },
    importedAt: { type: Date },
    importedBy: { type: String, trim: true },
    importNotes: { type: String, trim: true },
  },
  { timestamps: true }
)

EventSchema.index({ city: 1, dateTime: 1 })
EventSchema.index({ title: "text", venueName: "text", description: "text" })

const Event = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema)

export default Event
