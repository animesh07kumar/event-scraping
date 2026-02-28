"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import StatusTags from "@/components/events/StatusTags"

type DashboardEvent = {
  _id: string
  title: string
  dateTime: string | null
  venueName?: string
  venueAddress?: string
  city: string
  description?: string
  sourceName: string
  originalUrl: string
  statusTags: string[]
  imported: boolean
}

type ScrapeSummary = {
  sourceResults: Array<{
    sourceName: string
    fetched: number
    error?: string
  }>
  created: number
  updated: number
  unchanged: number
  inactivated: number
}

type EventsApiResponse = {
  events: DashboardEvent[]
  total: number
  page: number
  limit: number
  meta?: {
    cityLastScrapedAt?: string | null
  }
  error?: string
}

const ONE_HOUR_MS = 60 * 60 * 1000

const SOURCE_OPTIONS = [
  "cityofsydney",
  "sydney-com",
  "australia-com",
  "icc-sydney",
  "eventbrite",
  "predicthq-aberdeen",
]

const CITY_SOURCE_MAP: Record<string, string[]> = {
  sydney: ["cityofsydney", "sydney-com", "australia-com", "icc-sydney", "eventbrite"],
  aberdeen: ["predicthq-aberdeen"],
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "TBA"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "TBA"

  return date.toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getRecommendedSources = (cityValue: string) => {
  const key = cityValue.trim().toLowerCase()
  return CITY_SOURCE_MAP[key] ?? ["eventbrite"]
}

type DashboardClientProps = {
  defaultCity: string
  defaultDateFrom?: string
  defaultDateTo?: string
}

export default function DashboardClient({
  defaultCity,
  defaultDateFrom = "",
  defaultDateTo = "",
}: DashboardClientProps) {
  const [city, setCity] = useState(defaultCity || "Sydney")
  const [query, setQuery] = useState("")
  const [dateFrom, setDateFrom] = useState(defaultDateFrom)
  const [dateTo, setDateTo] = useState(defaultDateTo)
  const [status, setStatus] = useState("all")
  const [events, setEvents] = useState<DashboardEvent[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [importNotes, setImportNotes] = useState("")
  const [importLoadingId, setImportLoadingId] = useState("")
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [scrapeSummary, setScrapeSummary] = useState<ScrapeSummary | null>(null)
  const [selectedSources, setSelectedSources] = useState<string[]>(
    getRecommendedSources(defaultCity || "Sydney")
  )
  const [cityLastScrapedAt, setCityLastScrapedAt] = useState<string | null>(null)
  const [showStaleScrapePrompt, setShowStaleScrapePrompt] = useState(false)

  useEffect(() => {
    setCity(defaultCity || "Sydney")
    setDateFrom(defaultDateFrom || "")
    setDateTo(defaultDateTo || "")
    setSelectedSources(getRecommendedSources(defaultCity || "Sydney"))
  }, [defaultCity, defaultDateFrom, defaultDateTo])

  const selectedEvent = useMemo(
    () => events.find((event) => event._id === selectedId) ?? null,
    [events, selectedId]
  )

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams()
      params.set("city", city || "Sydney")
      if (query.trim()) params.set("q", query.trim())
      if (dateFrom) params.set("from", dateFrom)
      if (dateTo) params.set("to", dateTo)
      if (status !== "all") params.set("status", status)
      params.set("includeInactive", "true")
      params.set("limit", "100")

      const response = await fetch(`/api/events?${params.toString()}`)
      const data = (await response.json()) as EventsApiResponse

      if (!response.ok) {
        setError(data.error ?? "Failed to load events")
        setEvents([])
        setShowStaleScrapePrompt(false)
        return
      }

      const nextEvents = data.events ?? []
      const lastScraped = data.meta?.cityLastScrapedAt ?? null
      setCityLastScrapedAt(lastScraped)
      setEvents(nextEvents)
      setSelectedId((current) => current || nextEvents[0]?._id || "")

      if (nextEvents.length === 0) {
        const lastTime = lastScraped ? new Date(lastScraped).getTime() : null
        const isFreshEnough =
          typeof lastTime === "number" &&
          !Number.isNaN(lastTime) &&
          Date.now() - lastTime <= ONE_HOUR_MS

        setShowStaleScrapePrompt(!isFreshEnough)
      } else {
        setShowStaleScrapePrompt(false)
      }
    } catch {
      setError("Failed to load events")
      setEvents([])
      setShowStaleScrapePrompt(false)
    } finally {
      setLoading(false)
    }
  }, [city, query, dateFrom, dateTo, status])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const handleApplyFilters = async (e: React.FormEvent) => {
    e.preventDefault()
    await loadEvents()
  }

  const importEvent = async (eventId: string) => {
    setImportLoadingId(eventId)
    setError("")

    try {
      const response = await fetch(`/api/events/${eventId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: importNotes.trim() || undefined }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Failed to import event")
        return
      }

      setImportNotes("")
      await loadEvents()
    } catch {
      setError("Failed to import event")
    } finally {
      setImportLoadingId("")
    }
  }

  const runScrape = async (sourcesOverride?: string[]) => {
    const sources = sourcesOverride ?? selectedSources

    if (sources.length === 0) {
      setError("Select at least one source before running scrape.")
      return
    }

    setScrapeLoading(true)
    setError("")

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources, city }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Scrape failed")
        return
      }

      setScrapeSummary(data as ScrapeSummary)
      await loadEvents()
    } catch {
      setError("Scrape failed")
    } finally {
      setScrapeLoading(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Event Dashboard</h1>
        <Button onClick={() => void runScrape()} disabled={scrapeLoading}>
          {scrapeLoading ? "Scraping..." : "Run Scrape"}
        </Button>
      </div>

      <form onSubmit={handleApplyFilters} className="grid md:grid-cols-5 gap-3">
        <Input
          placeholder="City (default Sydney)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <Input
          placeholder="Keyword search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <div className="flex gap-2">
          <select
            className="border rounded-md px-3 py-2 text-sm w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="new">new</option>
            <option value="updated">updated</option>
            <option value="inactive">inactive</option>
            <option value="imported">imported</option>
          </select>
          <Button type="submit">Apply</Button>
        </div>
      </form>

      <section className="border rounded-md p-4 bg-gray-50 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Scraper Sources</h2>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setSelectedSources(SOURCE_OPTIONS)}>
              Select All
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedSources(getRecommendedSources(city))}
            >
              City Default
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setSelectedSources([])}>
              Clear
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-2">
          {SOURCE_OPTIONS.map((source) => {
            const checked = selectedSources.includes(source)
            return (
              <label
                key={source}
                className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setSelectedSources((current) =>
                      e.target.checked
                        ? [...new Set([...current, source])]
                        : current.filter((name) => name !== source)
                    )
                  }}
                />
                <span>{source}</span>
              </label>
            )
          })}
        </div>
      </section>

      {showStaleScrapePrompt && (
        <section className="border rounded-md p-4 bg-amber-50 text-sm space-y-2">
          <p className="text-amber-900">
            No events matched city/date filters and this city was not scraped in the last hour.
            Scrape latest data now.
          </p>
          <Button
            size="sm"
            onClick={() => void runScrape(getRecommendedSources(city))}
            disabled={scrapeLoading}
          >
            Scrape Latest For {city || "Selected City"}
          </Button>
        </section>
      )}

      {scrapeSummary && (
        <section className="border rounded-md p-4 bg-gray-50 text-sm space-y-2">
          <p>
            <strong>Scrape summary:</strong> created {scrapeSummary.created}, updated{" "}
            {scrapeSummary.updated}, unchanged {scrapeSummary.unchanged}, inactivated{" "}
            {scrapeSummary.inactivated}
          </p>
          {cityLastScrapedAt && (
            <p className="text-xs text-gray-600">
              Last scrape for {city}: {formatDateTime(cityLastScrapedAt)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {scrapeSummary.sourceResults.map((result) => (
              <span key={result.sourceName} className="border rounded-md px-2 py-1 bg-white">
                {result.sourceName}: {result.fetched}
                {result.error ? ` (${result.error})` : ""}
              </span>
            ))}
          </div>
        </section>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <section className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <div className="border rounded-lg overflow-hidden bg-white">
          {loading ? (
            <p className="p-4 text-sm text-gray-600">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="p-4 text-sm text-gray-600">
              No events found for selected filters. Try adjusting date range or scrape latest.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event._id}
                    className={selectedId === event._id ? "bg-gray-50" : ""}
                    onClick={() => setSelectedId(event._id)}
                  >
                    <TableCell className="max-w-xs truncate">{event.title}</TableCell>
                    <TableCell>{formatDateTime(event.dateTime)}</TableCell>
                    <TableCell>{event.venueName || "Venue TBA"}</TableCell>
                    <TableCell>{event.sourceName}</TableCell>
                    <TableCell>
                      <StatusTags tags={event.statusTags} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          void importEvent(event._id)
                        }}
                        disabled={importLoadingId === event._id || event.imported}
                      >
                        {event.imported ? "Imported" : "Import"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <aside className="border rounded-lg p-4 bg-white space-y-3">
          {!selectedEvent ? (
            <p className="text-sm text-gray-600">Select an event to preview full details.</p>
          ) : (
            <>
              <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              <StatusTags tags={selectedEvent.statusTags} />
              <p className="text-sm text-gray-700">{formatDateTime(selectedEvent.dateTime)}</p>
              <p className="text-sm text-gray-700">
                {selectedEvent.venueName || "Venue TBA"}
                {selectedEvent.venueAddress ? `, ${selectedEvent.venueAddress}` : ""}
              </p>
              <p className="text-sm text-gray-700">City: {selectedEvent.city}</p>
              <p className="text-sm text-gray-600">
                {selectedEvent.description || "No description available."}
              </p>
              <p className="text-sm text-gray-700">Source: {selectedEvent.sourceName}</p>

              <a
                href={selectedEvent.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 underline"
              >
                Open source event page
              </a>

              <Textarea
                placeholder="Optional import notes"
                value={importNotes}
                onChange={(e) => setImportNotes(e.target.value)}
              />

              <Button
                className="w-full"
                onClick={() => void importEvent(selectedEvent._id)}
                disabled={importLoadingId === selectedEvent._id || selectedEvent.imported}
              >
                {selectedEvent.imported ? "Already Imported" : "Import to Platform"}
              </Button>
            </>
          )}
        </aside>
      </section>
    </main>
  )
}
