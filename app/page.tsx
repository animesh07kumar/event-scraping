import Link from "next/link"
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
  city: string
}

type CityEventGroup = {
  city: string
  events: HomeEvent[]
  totalInCity: number
}

const MAX_TOTAL_EVENTS = 10
const MAX_PER_CITY = 2

const formatTodayDateParam = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, "0")
  const dd = `${date.getDate()}`.padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

async function loadTodayEventGroups(): Promise<{
  groups: CityEventGroup[]
  todayDate: string
}> {
  const now = new Date()
  const todayDate = formatTodayDateParam(now)
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  try {
    await connectToDatabase()

    const events = await Event.find({
      isActive: true,
      dateTime: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ city: 1, dateTime: 1 })
      .limit(500)
      .lean()

    const cityTotals = new Map<string, number>()
    for (const event of events) {
      const city = (event.city || "Unknown").trim()
      cityTotals.set(city, (cityTotals.get(city) ?? 0) + 1)
    }

    const selectedByCity = new Map<string, HomeEvent[]>()
    let selectedTotal = 0

    for (const event of events) {
      if (selectedTotal >= MAX_TOTAL_EVENTS) break

      const city = (event.city || "Unknown").trim()
      const citySelected = selectedByCity.get(city) ?? []

      if (citySelected.length >= MAX_PER_CITY) {
        continue
      }

      citySelected.push({
        _id: event._id.toString(),
        title: event.title,
        dateTime: event.dateTime ? new Date(event.dateTime) : new Date(),
        venueName: event.venueName ?? "",
        description: event.description ?? "",
        sourceName: event.sourceName,
        statusTags: (event.statusTags ?? []) as string[],
        city,
      })

      selectedByCity.set(city, citySelected)
      selectedTotal += 1
    }

    const groups = [...selectedByCity.entries()]
      .map(([city, cityEvents]) => ({
        city,
        events: cityEvents,
        totalInCity: cityTotals.get(city) ?? cityEvents.length,
      }))
      .sort((a, b) => a.city.localeCompare(b.city))

    return { groups, todayDate }
  } catch {
    return { groups: [], todayDate }
  }
}

export default async function HomePage() {
  const { groups, todayDate } = await loadTodayEventGroups()

  return (
    <main className="max-w-6xl mx-auto py-16 px-4 space-y-8">


      <CountryCityGuide />

      {groups.length === 0 ? (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-2">No events found for today</h2>
          <p className="text-sm text-gray-600">
            Open dashboard and run scrape to refresh latest city events.
          </p>
          <div className="mt-3">
            <Link href="/dashboard?city=Sydney" className="rounded-md bg-black text-white px-3 py-2 text-sm">
              Open Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <section className="space-y-8">
          <section className="space-y-3">
            <h1 className="text-4xl font-bold">Today&apos;s Events</h1>
            <p className="text-gray-600 text-lg">
              Showing up today&apos;s event, grouped by city.
            </p>
          </section>
          {groups.map((group) => (
            <div key={group.city} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-semibold">{group.city}</h2>
                <Link
                  href={`/dashboard?city=${encodeURIComponent(group.city)}&from=${todayDate}&to=${todayDate}`}
                  className="rounded-md bg-black text-white px-3 py-2 text-sm"
                >
                  Open in dashboard
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.events.map((event) => (
                  <article key={event._id} className="border rounded-lg p-5 bg-white space-y-3">
                    <h3 className="text-lg font-semibold leading-tight">{event.title}</h3>

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

                {group.totalInCity > group.events.length && (
                  <Link
                    href={`/dashboard?city=${encodeURIComponent(group.city)}&from=${todayDate}&to=${todayDate}`}
                    className="border rounded-lg p-5 bg-gray-50 hover:bg-gray-100 transition flex flex-col justify-center"
                  >
                    <h3 className="text-lg font-semibold">Show More</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      View all {group.totalInCity} events for {group.city} in dashboard.
                    </p>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
