import { Page } from "playwright"
import { ScraperSourceScript } from "@/services/scraper/types"
import { scrapeListingPage } from "@/services/scraper/utils"

const CITY_COUNTRY_SLUG_MAP: Record<string, string> = {
  sydney: "australia",
  melbourne: "australia",
  brisbane: "australia",
  perth: "australia",
  london: "united-kingdom",
  manchester: "united-kingdom",
  aberdeen: "united-kingdom",
  mumbai: "india",
  bengaluru: "india",
  delhi: "india",
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ")

const cityToEventbriteUrl = (city: string) => {
  const citySlug = slugify(city) || "sydney"
  const countrySlug = CITY_COUNTRY_SLUG_MAP[citySlug]

  if (countrySlug) {
    return `https://www.eventbrite.com/d/${countrySlug}--${citySlug}/events/`
  }

  return `https://www.eventbrite.com/d/online/all-events/?q=${encodeURIComponent(city)}`
}

export const createEventbriteSourceForCity = (cityInput: string): ScraperSourceScript => {
  const city = toTitleCase(cityInput || "Sydney")
  const url = cityToEventbriteUrl(city)

  return {
    sourceName: "eventbrite",
    startUrl: url,
    city,
    countryCode: "GLOBAL",
    tags: ["ticketing", "aggregator", city.toLowerCase()],
    scrape: async (page: Page) =>
      scrapeListingPage(page, {
        url,
        sourceName: "eventbrite",
        city,
        countryCode: "GLOBAL",
        tags: ["ticketing", "aggregator", city.toLowerCase()],
        linkIncludes: ["/e/", "/events/"],
        waitMs: 4000,
        limit: 80,
      }),
  }
}

export const eventbriteSource = createEventbriteSourceForCity("Sydney")
