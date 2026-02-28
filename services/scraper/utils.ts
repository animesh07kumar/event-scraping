import crypto from "node:crypto"
import { Page } from "playwright"
import { ScrapedEventInput } from "@/services/scraper/types"

type ListingScrapeConfig = {
  url: string
  sourceName: string
  city: string
  countryCode: string
  tags: string[]
  linkIncludes: string[]
  waitMs?: number
  limit?: number
}

const COOKIE_ACCEPT_LABELS = [
  "Accept",
  "Accept all",
  "Allow all",
  "I agree",
  "Agree",
  "OK",
]

const MAX_EVENTS_PER_SOURCE = 60

type JsonObject = Record<string, unknown>

export const cleanText = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim()

export const normalizeUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    parsed.hash = ""
    parsed.searchParams.sort()
    return parsed.toString()
  } catch {
    return url.trim()
  }
}

const readString = (value: unknown): string => {
  if (typeof value === "string") {
    return cleanText(value)
  }
  return ""
}

const readStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(readString).filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => cleanText(entry))
      .filter(Boolean)
  }

  return []
}

const normalizeDateText = (value: string) =>
  value
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .replace(/\bAEDT\b/gi, "GMT+11")
    .replace(/\bAEST\b/gi, "GMT+10")
    .replace(/\bACDT\b/gi, "GMT+10:30")
    .replace(/\bACST\b/gi, "GMT+9:30")
    .replace(/\bAWST\b/gi, "GMT+8")

export const parseDate = (value: string | null | undefined): Date | null => {
  const raw = cleanText(value)
  if (!raw) return null

  const normalized = normalizeDateText(raw)
  const direct = new Date(normalized)
  if (!Number.isNaN(direct.getTime())) return direct

  const noComma = normalized.replace(/,\s*/g, " ")
  const fallback = new Date(noComma)
  if (!Number.isNaN(fallback.getTime())) return fallback

  return null
}

export const createContentHash = (event: ScrapedEventInput) => {
  const payload = [
    cleanText(event.title).toLowerCase(),
    event.dateTime?.toISOString() ?? "",
    cleanText(event.venueName).toLowerCase(),
    cleanText(event.venueAddress).toLowerCase(),
    cleanText(event.description).toLowerCase(),
    cleanText(event.imageUrl),
    normalizeUrl(event.originalUrl).toLowerCase(),
  ].join("|")

  return crypto.createHash("sha256").update(payload).digest("hex")
}

export const dedupeScrapedEvents = (events: ScrapedEventInput[]) => {
  const byKey = new Map<string, ScrapedEventInput>()

  for (const event of events) {
    const title = cleanText(event.title)
    const originalUrl = normalizeUrl(event.originalUrl)
    if (!title || !originalUrl) continue

    const key = `${event.sourceName}:${originalUrl}`
    byKey.set(key, {
      ...event,
      title,
      originalUrl,
      city: cleanText(event.city) || "Sydney",
      venueName: cleanText(event.venueName) || undefined,
      venueAddress: cleanText(event.venueAddress) || undefined,
      description: cleanText(event.description) || undefined,
      imageUrl: cleanText(event.imageUrl) || undefined,
      categoryTags: (event.categoryTags ?? []).map(cleanText).filter(Boolean),
    })
  }

  return [...byKey.values()]
}

const flattenJsonLdNodes = (value: unknown, nodes: JsonObject[]) => {
  if (!value) return

  if (Array.isArray(value)) {
    for (const item of value) {
      flattenJsonLdNodes(item, nodes)
    }
    return
  }

  if (typeof value !== "object") {
    return
  }

  const record = value as JsonObject
  nodes.push(record)

  if (Array.isArray(record["@graph"])) {
    flattenJsonLdNodes(record["@graph"], nodes)
  }
}

const hasEventType = (node: JsonObject) => {
  const rawType = node["@type"]
  const types = Array.isArray(rawType) ? rawType : [rawType]
  return types.some((value) => readString(value).toLowerCase().includes("event"))
}

const parseVenueFromLocation = (location: unknown) => {
  if (!location) {
    return {
      venueName: "",
      venueAddress: "",
      city: "",
    }
  }

  if (typeof location === "string") {
    return {
      venueName: cleanText(location),
      venueAddress: "",
      city: "",
    }
  }

  if (Array.isArray(location)) {
    const first = location[0]
    return parseVenueFromLocation(first)
  }

  const locationObject = location as JsonObject
  const venueName = readString(locationObject.name)

  const address = locationObject.address
  if (typeof address === "string") {
    return {
      venueName,
      venueAddress: cleanText(address),
      city: "",
    }
  }

  if (!address || typeof address !== "object") {
    return {
      venueName,
      venueAddress: "",
      city: "",
    }
  }

  const addressObject = address as JsonObject
  const street = readString(addressObject.streetAddress)
  const locality = readString(addressObject.addressLocality)
  const region = readString(addressObject.addressRegion)
  const country = readString(addressObject.addressCountry)

  const venueAddress = [street, locality, region, country].filter(Boolean).join(", ")

  return {
    venueName,
    venueAddress,
    city: locality,
  }
}

const parseEventUrl = (node: JsonObject, baseUrl: string) => {
  const candidate =
    readString(node.url) ||
    readString(node["@id"]) ||
    readString((node.offers as JsonObject | undefined)?.url)

  if (!candidate) return ""

  try {
    return new URL(candidate, baseUrl).toString()
  } catch {
    return candidate
  }
}

const parseImageUrl = (value: unknown, baseUrl: string) => {
  if (!value) return ""

  const candidate =
    readString(value) ||
    readString((Array.isArray(value) ? value[0] : value) as unknown) ||
    readString((value as JsonObject).url)

  if (!candidate) return ""

  try {
    return new URL(candidate, baseUrl).toString()
  } catch {
    return candidate
  }
}

const extractJsonLdEvents = async (page: Page, config: ListingScrapeConfig) => {
  const rawBlocks = await page
    .$$eval("script[type='application/ld+json']", (scripts) =>
      scripts.map((script) => script.textContent ?? "")
    )
    .catch(() => [] as string[])

  const nodes: JsonObject[] = []

  for (const block of rawBlocks) {
    try {
      flattenJsonLdNodes(JSON.parse(block), nodes)
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }

  const events: ScrapedEventInput[] = []

  for (const node of nodes) {
    if (!hasEventType(node)) {
      continue
    }

    const title = readString(node.name)
    const originalUrl = parseEventUrl(node, config.url)
    if (!title || !originalUrl) {
      continue
    }

    const startDate =
      readString(node.startDate) || readString((node.eventSchedule as JsonObject)?.startDate)
    const { venueName, venueAddress, city } = parseVenueFromLocation(node.location)
    const keywords = readStringArray(node.keywords)

    events.push({
      title,
      dateTime: parseDate(startDate),
      venueName,
      venueAddress,
      city: city || config.city,
      description: readString(node.description),
      categoryTags: [...config.tags, ...keywords, config.countryCode.toLowerCase()],
      imageUrl: parseImageUrl(node.image, config.url),
      sourceName: config.sourceName,
      originalUrl,
    })
  }

  return dedupeScrapedEvents(events).slice(0, config.limit ?? MAX_EVENTS_PER_SOURCE)
}

const extractAnchorEvents = async (page: Page, config: ListingScrapeConfig) => {
  const rows = await page.evaluate(
    ({ linkIncludes, maxRows }) => {
      const normalizedPatterns = linkIncludes.map((pattern) => pattern.toLowerCase())
      const anchors = Array.from(document.querySelectorAll("a[href]"))
      const results: Array<{
        title: string
        dateText: string
        venueName: string
        description: string
        imageUrl: string
        originalUrl: string
      }> = []

      const seen = new Set<string>()

      for (const anchor of anchors) {
        const href = anchor.getAttribute("href")
        if (!href) continue

        let originalUrl = ""
        try {
          originalUrl = new URL(href, window.location.origin).toString()
        } catch {
          continue
        }

        if (!originalUrl.startsWith("http")) continue
        if (seen.has(originalUrl)) continue

        const lowerHref = originalUrl.toLowerCase()
        const matched =
          normalizedPatterns.length === 0 ||
          normalizedPatterns.some((pattern) => lowerHref.includes(pattern))

        if (!matched) continue

        const card =
          anchor.closest("article") ??
          anchor.closest("li") ??
          anchor.closest("section") ??
          anchor.closest("div")

        const titleEl =
          card?.querySelector(
            "h1, h2, h3, h4, [data-testid*='title'], [class*='title'], [class*='heading']"
          ) ?? anchor
        const title = (titleEl?.textContent ?? anchor.textContent ?? "")
          .replace(/\s+/g, " ")
          .trim()
        if (!title || title.length < 5) continue

        const timeEl = card?.querySelector("time")
        const dateText = (
          timeEl?.getAttribute("datetime") ??
          timeEl?.textContent ??
          card?.querySelector("[datetime]")?.getAttribute("datetime") ??
          ""
        )
          .replace(/\s+/g, " ")
          .trim()

        const locationEl = card?.querySelector(
          "address, [class*='venue'], [class*='location'], [data-testid*='venue'], [data-testid*='location']"
        )
        const descriptionEl = card?.querySelector(
          "p, [class*='description'], [data-testid*='summary'], [data-testid*='description']"
        )
        const imageEl = card?.querySelector("img")

        const venueName = (locationEl?.textContent ?? "").replace(/\s+/g, " ").trim()
        const description = (descriptionEl?.textContent ?? "").replace(/\s+/g, " ").trim()
        const imageUrl = (imageEl?.getAttribute("src") ?? "").trim()

        seen.add(originalUrl)
        results.push({
          title,
          dateText,
          venueName,
          description,
          imageUrl,
          originalUrl,
        })

        if (results.length >= maxRows) {
          break
        }
      }

      return results
    },
    {
      linkIncludes: config.linkIncludes,
      maxRows: config.limit ?? MAX_EVENTS_PER_SOURCE,
    }
  )

  const mapped = rows.map((row) => {
    const imageUrl = row.imageUrl
      ? new URL(row.imageUrl, config.url).toString()
      : undefined

    return {
      title: row.title,
      dateTime: parseDate(row.dateText),
      venueName: row.venueName,
      city: config.city,
      description: row.description,
      categoryTags: [...config.tags, config.countryCode.toLowerCase()],
      imageUrl,
      sourceName: config.sourceName,
      originalUrl: row.originalUrl,
    } satisfies ScrapedEventInput
  })

  return dedupeScrapedEvents(mapped).slice(0, config.limit ?? MAX_EVENTS_PER_SOURCE)
}

const dismissCookieBanners = async (page: Page) => {
  for (const label of COOKIE_ACCEPT_LABELS) {
    try {
      const button = page.getByRole("button", { name: new RegExp(`^${label}$`, "i") }).first()
      await button.click({ timeout: 1200 })
      break
    } catch {
      // cookie banner not present
    }
  }
}

const gotoAndSettle = async (page: Page, url: string, waitMs: number) => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 70000 })
  await dismissCookieBanners(page)
  await page.waitForTimeout(waitMs)

  const title = (await page.title()).toLowerCase()
  if (
    title.includes("confirm you are human") ||
    title.includes("just a moment") ||
    title.includes("attention required")
  ) {
    throw new Error("Blocked by anti-bot challenge on source site")
  }
}

export const scrapeListingPage = async (page: Page, config: ListingScrapeConfig) => {
  await gotoAndSettle(page, config.url, config.waitMs ?? 3000)

  const [jsonLdEvents, anchorEvents] = await Promise.all([
    extractJsonLdEvents(page, config),
    extractAnchorEvents(page, config),
  ])

  return dedupeScrapedEvents([...jsonLdEvents, ...anchorEvents]).slice(
    0,
    config.limit ?? MAX_EVENTS_PER_SOURCE
  )
}
