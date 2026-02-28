import { chromium } from "playwright"
import Event, { EventStatusTag } from "@/models/Event"
import { ALL_SCRAPER_SOURCES, SCRAPER_SOURCES } from "@/services/scraper/sources"
import { createEventbriteSourceForCity } from "@/services/scraper/sources/eventbrite"
import {
  ScrapedEventInput,
  ScrapePipelineResult,
  ScraperSourceScript,
} from "@/services/scraper/types"
import {
  cleanText,
  createContentHash,
  dedupeScrapedEvents,
  normalizeUrl,
} from "@/services/scraper/utils"

type GatheredEvents = {
  events: ScrapedEventInput[]
  sourceResults: ScrapePipelineResult["sourceResults"]
  successfulSourceNames: string[]
}

const mergeStatusTags = (
  previous: EventStatusTag[],
  {
    isChanged,
    isImported,
    makeInactive,
  }: { isChanged: boolean; isImported: boolean; makeInactive: boolean }
) => {
  const status = new Set(previous)

  if (makeInactive) {
    status.add(EventStatusTag.INACTIVE)
  } else {
    status.delete(EventStatusTag.INACTIVE)
  }

  if (isChanged) {
    status.delete(EventStatusTag.NEW)
    status.add(EventStatusTag.UPDATED)
  }

  if (isImported) {
    status.add(EventStatusTag.IMPORTED)
  } else {
    status.delete(EventStatusTag.IMPORTED)
  }

  if (status.size === 0) {
    status.add(EventStatusTag.NEW)
  }

  return [...status]
}

const gatherEventsFromSources = async (
  selectedSources: ScraperSourceScript[]
): Promise<GatheredEvents> => {
  const sourceResults: ScrapePipelineResult["sourceResults"] = []
  const successfulSourceNames: string[] = []
  const allEvents: ScrapedEventInput[] = []

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  })

  try {
    for (const source of selectedSources) {
      const page = await context.newPage()

      try {
        const events = await source.scrape(page)
        const normalizedEvents = dedupeScrapedEvents(events).map((event) => ({
          ...event,
          city: cleanText(event.city) || source.city,
          categoryTags: [...(event.categoryTags ?? []), source.countryCode.toLowerCase()],
        }))

        sourceResults.push({
          sourceName: source.sourceName,
          fetched: normalizedEvents.length,
        })
        successfulSourceNames.push(source.sourceName)
        allEvents.push(...normalizedEvents)
      } catch (error) {
        sourceResults.push({
          sourceName: source.sourceName,
          fetched: 0,
          error: error instanceof Error ? error.message : "Source scraper failed",
        })
      } finally {
        await page.close()
      }
    }
  } finally {
    await context.close()
    await browser.close()
  }

  return {
    events: dedupeScrapedEvents(allEvents),
    sourceResults,
    successfulSourceNames,
  }
}

const persistScrapedEvents = async (
  scrapedEvents: ScrapedEventInput[],
  sourceResults: ScrapePipelineResult["sourceResults"],
  successfulSourceNames: string[]
): Promise<ScrapePipelineResult> => {
  const now = new Date()
  const seenSourceKeys = new Set<string>()
  let created = 0
  let updated = 0
  let unchanged = 0

  for (const event of scrapedEvents) {
    const normalizedEvent: ScrapedEventInput = {
      ...event,
      title: cleanText(event.title),
      originalUrl: normalizeUrl(event.originalUrl),
      city: cleanText(event.city) || "Sydney",
      venueName: cleanText(event.venueName) || undefined,
      venueAddress: cleanText(event.venueAddress) || undefined,
      description: cleanText(event.description) || undefined,
      imageUrl: cleanText(event.imageUrl) || undefined,
      dateTime: event.dateTime ?? now,
      categoryTags: (event.categoryTags ?? []).map((tag) => cleanText(tag)).filter(Boolean),
    }

    if (!normalizedEvent.title || !normalizedEvent.originalUrl) {
      continue
    }

    const sourceKey = `${normalizedEvent.sourceName}:${normalizedEvent.originalUrl}`
    seenSourceKeys.add(sourceKey)

    const contentHash = createContentHash(normalizedEvent)
    const existingEvent = await Event.findOne({ sourceKey })

    if (!existingEvent) {
      await Event.create({
        ...normalizedEvent,
        sourceKey,
        contentHash,
        statusTags: [EventStatusTag.NEW],
        lastScrapedAt: now,
        lastSeenAt: now,
        isActive: true,
        imported: false,
      })
      created += 1
      continue
    }

    const hasChanged = existingEvent.contentHash !== contentHash
    const wasInactive = !existingEvent.isActive
    const shouldMarkUpdated = hasChanged || wasInactive

    existingEvent.title = normalizedEvent.title
    existingEvent.dateTime = normalizedEvent.dateTime ?? now
    existingEvent.venueName = normalizedEvent.venueName
    existingEvent.venueAddress = normalizedEvent.venueAddress
    existingEvent.city = normalizedEvent.city
    existingEvent.description = normalizedEvent.description
    existingEvent.categoryTags = normalizedEvent.categoryTags ?? []
    existingEvent.imageUrl = normalizedEvent.imageUrl
    existingEvent.sourceName = normalizedEvent.sourceName
    existingEvent.originalUrl = normalizedEvent.originalUrl
    existingEvent.contentHash = contentHash
    existingEvent.lastScrapedAt = now
    existingEvent.lastSeenAt = now
    existingEvent.isActive = true
    existingEvent.statusTags = mergeStatusTags(existingEvent.statusTags as EventStatusTag[], {
      isChanged: shouldMarkUpdated,
      isImported: existingEvent.imported,
      makeInactive: false,
    })
    await existingEvent.save()

    if (shouldMarkUpdated) {
      updated += 1
    } else {
      unchanged += 1
    }
  }

  let inactivated = 0

  if (successfulSourceNames.length > 0) {
    const candidates = await Event.find({
      sourceName: { $in: successfulSourceNames },
      sourceKey: { $nin: [...seenSourceKeys] },
      isActive: true,
    })

    for (const candidate of candidates) {
      candidate.isActive = false
      candidate.lastScrapedAt = now
      candidate.statusTags = mergeStatusTags(candidate.statusTags as EventStatusTag[], {
        isChanged: false,
        isImported: candidate.imported,
        makeInactive: true,
      })
      await candidate.save()
      inactivated += 1
    }
  }

  const pastCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const expiredEvents = await Event.find({
    dateTime: { $lt: pastCutoff },
    isActive: true,
  })

  for (const event of expiredEvents) {
    event.isActive = false
    event.statusTags = mergeStatusTags(event.statusTags as EventStatusTag[], {
      isChanged: false,
      isImported: event.imported,
      makeInactive: true,
    })
    await event.save()
    inactivated += 1
  }

  return {
    sourceResults,
    created,
    updated,
    unchanged,
    inactivated,
  }
}

const resolveSources = (sourceNames?: string[], city?: string) => {
  if (!sourceNames) {
    if (city?.trim()) {
      return SCRAPER_SOURCES.map((source) =>
        source.sourceName === "eventbrite"
          ? createEventbriteSourceForCity(city)
          : source
      )
    }
    return SCRAPER_SOURCES
  }

  const requested = new Set(sourceNames.map((name) => name.toLowerCase()))
  const selected = ALL_SCRAPER_SOURCES.filter((source) =>
    requested.has(source.sourceName.toLowerCase())
  )

  if (!city?.trim()) {
    return selected
  }

  return selected.map((source) =>
    source.sourceName === "eventbrite"
      ? createEventbriteSourceForCity(city)
      : source
  )
}

export const runScrapePipeline = async (
  sourceNames?: string[],
  city?: string
): Promise<ScrapePipelineResult> => {
  const selectedSources = resolveSources(sourceNames, city)
  const { events, sourceResults, successfulSourceNames } = await gatherEventsFromSources(
    selectedSources
  )
  return persistScrapedEvents(events, sourceResults, successfulSourceNames)
}
