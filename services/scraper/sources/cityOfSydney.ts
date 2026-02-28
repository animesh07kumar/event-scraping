import { Page } from "playwright"
import { ScraperSourceScript } from "@/services/scraper/types"
import { scrapeListingPage } from "@/services/scraper/utils"

const START_URL = "https://whatson.cityofsydney.nsw.gov.au/"

export const cityOfSydneySource: ScraperSourceScript = {
  sourceName: "cityofsydney",
  startUrl: START_URL,
  city: "Sydney",
  countryCode: "AU",
  tags: ["city-council", "public-events", "sydney"],
  scrape: async (page: Page) =>
    scrapeListingPage(page, {
      url: START_URL,
      sourceName: "cityofsydney",
      city: "Sydney",
      countryCode: "AU",
      tags: ["city-council", "public-events", "sydney"],
      linkIncludes: ["/events/"],
      waitMs: 3500,
      limit: 60,
    }),
}
