import { connectToDatabase } from "@/lib/db"
import Event from "@/models/Event"
import GetTicketsDialog from "@/components/events/GetTicketsDialog"
import StatusTags from "@/components/events/StatusTags"
import CountryCityGuide from "@/components/events/CountryCityGuide"

type HomeEvent = {
  _id: string
  title: string
  dateTime: Date
  venueName?: string
  description?: string
  sourceName: string
  statusTags: string[]
}

async function loadSydneyEvents(): Promise<HomeEvent[]> {
  try {
    await connectToDatabase()
    const events = await Event.find({
      city: /sydney/i,
      isActive: true,
    })
      .sort({ dateTime: 1 })
      .limit(18)
      .lean()

    return events.map((event) => ({
      _id: event._id.toString(),
      title: event.title,
      dateTime: event.dateTime ? new Date(event.dateTime) : new Date(),
      venueName: event.venueName ?? "",
      description: event.description ?? "",
      sourceName: event.sourceName,
      statusTags: (event.statusTags ?? []) as string[],
    }))
  } catch {
    return []
  }
}

export default async function HomePage() {
  const events = await loadSydneyEvents()

  return (
    <main className="max-w-6xl mx-auto py-16 px-4 space-y-8">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold">Sydney Events</h1>
        <p className="text-gray-600 text-lg">
          Automatically scraped and updated from public event sources.
        </p>
      </section>

      <CountryCityGuide />

      {events.length === 0 ? (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-2">No events available yet</h2>
          <p className="text-sm text-gray-600">
            Run a scrape from the dashboard to populate the event feed.
          </p>
        </div>
      ) : (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <article key={event._id} className="border rounded-lg p-5 bg-white space-y-3">
              <h2 className="text-lg font-semibold leading-tight">{event.title}</h2>

              <p className="text-sm text-gray-700">
                {event.dateTime.toLocaleString("en-AU", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <p className="text-sm text-gray-600">{event.venueName || "Venue TBA"}</p>

              <p className="text-sm text-gray-600 line-clamp-3">
                {event.description || "No description available."}
              </p>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  Source: {event.sourceName}
                </span>
                <StatusTags tags={event.statusTags} />
              </div>

              <GetTicketsDialog eventId={event._id} eventTitle={event.title} />
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
