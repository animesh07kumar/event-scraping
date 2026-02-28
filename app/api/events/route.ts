import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Event, { EventStatusTag } from "@/models/Event"

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export async function GET(request: NextRequest) {
  await connectToDatabase()

  const params = request.nextUrl.searchParams
  const city = params.get("city")?.trim() || "Sydney"
  const query = params.get("q")?.trim()
  const status = params.get("status")?.trim()
  const includeInactive = params.get("includeInactive") === "true"
  const from = params.get("from")
  const to = params.get("to")

  const page = Number(params.get("page") || 1)
  const limit = Math.min(Number(params.get("limit") || 25), 100)
  const skip = Math.max(page - 1, 0) * limit

  const filters: Record<string, unknown> = {
    city: new RegExp(`^${escapeRegExp(city)}$`, "i"),
  }

  if (!includeInactive) {
    filters.isActive = true
  }

  if (query) {
    const searchRegex = new RegExp(escapeRegExp(query), "i")
    filters.$or = [
      { title: searchRegex },
      { venueName: searchRegex },
      { description: searchRegex },
    ]
  }

  if (status && Object.values(EventStatusTag).includes(status as EventStatusTag)) {
    filters.statusTags = status
  }

  if (from || to) {
    filters.dateTime = {}

    if (from) {
      const fromDate = new Date(from)
      if (!Number.isNaN(fromDate.getTime())) {
        ;(filters.dateTime as Record<string, Date>).$gte = fromDate
      }
    }

    if (to) {
      const toDate = new Date(to)
      if (!Number.isNaN(toDate.getTime())) {
        ;(filters.dateTime as Record<string, Date>).$lte = toDate
      }
    }

    if (Object.keys(filters.dateTime as Record<string, Date>).length === 0) {
      delete filters.dateTime
    }
  }

  const [events, total] = await Promise.all([
    Event.find(filters).sort({ dateTime: 1 }).skip(skip).limit(limit).lean(),
    Event.countDocuments(filters),
  ])

  const normalizedEvents = events.map((event) => ({
    ...event,
    _id: event._id.toString(),
    dateTime: event.dateTime ? new Date(event.dateTime).toISOString() : null,
    lastScrapedAt: event.lastScrapedAt
      ? new Date(event.lastScrapedAt).toISOString()
      : null,
    lastSeenAt: event.lastSeenAt ? new Date(event.lastSeenAt).toISOString() : null,
    importedAt: event.importedAt ? new Date(event.importedAt).toISOString() : null,
    createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
    updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : null,
  }))

  return NextResponse.json({
    events: normalizedEvents,
    total,
    page,
    limit,
  })
}
