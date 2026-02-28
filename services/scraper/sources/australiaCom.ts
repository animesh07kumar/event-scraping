import { Page } from "playwright"
import { ScraperSourceScript } from "@/services/scraper/types"
import { scrapeListingPage } from "@/services/scraper/utils"

const START_URL = "https://www.australia.com/en-in/events/australias-events-calendar.html"

export const australiaComSource: ScraperSourceScript = {
  sourceName: "australia-com",
  startUrl: START_URL,
  city: "Sydney",
  countryCode: "AU",
  tags: ["national-calendar", "tourism-australia"],
  scrape: async (page: Page) =>
    scrapeListingPage(page, {
      url: START_URL,
      sourceName: "australia-com",
      city: "Sydney",
      countryCode: "AU",
      tags: ["national-calendar", "tourism-australia"],
      linkIncludes: ["/events/"],
      waitMs: 4000,
      limit: 60,
    }),
}
