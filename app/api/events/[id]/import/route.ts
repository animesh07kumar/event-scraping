import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import { auth } from "@/auth"
import { connectToDatabase } from "@/lib/db"
import Event, { EventStatusTag } from "@/models/Event"

const payloadSchema = z.object({
  notes: z.string().trim().max(500).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  await connectToDatabase()

  const event = await Event.findById(id)
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  event.imported = true
  event.importedAt = new Date()
  event.importedBy = session.user.email
  event.importNotes = parsed.data.notes
  event.statusTags = [...new Set([...(event.statusTags ?? []), EventStatusTag.IMPORTED])]

  await event.save()

  return NextResponse.json({ success: true })
}
