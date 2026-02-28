import mongoose, { Document, Schema, Types } from "mongoose"

export interface ITicketLead extends Document {
  eventId: Types.ObjectId
  email: string
  consent: boolean
  createdAt?: Date
  updatedAt?: Date
}

const TicketLeadSchema = new Schema<ITicketLead>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    consent: { type: Boolean, required: true },
  },
  { timestamps: true }
)

TicketLeadSchema.index({ eventId: 1, email: 1 })

const TicketLead =
  mongoose.models.TicketLead ||
  mongoose.model<ITicketLead>("TicketLead", TicketLeadSchema)

export default TicketLead
