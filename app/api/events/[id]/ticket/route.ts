import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import { connectToDatabase } from "@/lib/db"
import Event from "@/models/Event"
import TicketLead from "@/models/TicketLead"

const payloadSchema = z.object({
  email: z.string().email(),
  consent: z.boolean(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 })
  }

  const body = await request.json()
  const parsed = payloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (!parsed.data.consent) {
    return NextResponse.json({ error: "Consent is required" }, { status: 400 })
  }

  await connectToDatabase()

  const event = await Event.findById(id)
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  await TicketLead.create({
    eventId: event._id,
    email: parsed.data.email.toLowerCase(),
    consent: parsed.data.consent,
  })

  return NextResponse.json({
    success: true,
    redirectUrl: event.originalUrl,
  })
}
