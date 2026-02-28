import { Page } from "playwright"
import { ScraperSourceScript } from "@/services/scraper/types"
import { scrapeListingPage } from "@/services/scraper/utils"

const START_URL = "https://www.eventbrite.com.au/d/australia--sydney/events/"

export const eventbriteSource: ScraperSourceScript = {
  sourceName: "eventbrite",
  startUrl: START_URL,
  city: "Sydney",
  countryCode: "AU",
  tags: ["ticketing", "aggregator", "sydney"],
  scrape: async (page: Page) =>
    scrapeListingPage(page, {
      url: START_URL,
      sourceName: "eventbrite",
      city: "Sydney",
      countryCode: "AU",
      tags: ["ticketing", "aggregator", "sydney"],
      linkIncludes: ["/e/", "/events/"],
      waitMs: 4000,
      limit: 80,
    }),
}
