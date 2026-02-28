import { Page } from "playwright"
import { ScraperSourceScript } from "@/services/scraper/types"
import { scrapeListingPage } from "@/services/scraper/utils"

const START_URL = "https://www.sydney.com/events"

export const sydneyComSource: ScraperSourceScript = {
  sourceName: "sydney-com",
  startUrl: START_URL,
  city: "Sydney",
  countryCode: "AU",
  tags: ["tourism", "city-events", "sydney"],
  scrape: async (page: Page) =>
    scrapeListingPage(page, {
      url: START_URL,
      sourceName: "sydney-com",
      city: "Sydney",
      countryCode: "AU",
      tags: ["tourism", "city-events", "sydney"],
      linkIncludes: ["/events/"],
      waitMs: 3500,
      limit: 60,
    }),
}
