import { Page } from "playwright"
import { ScraperSourceScript } from "@/services/scraper/types"
import { scrapeListingPage } from "@/services/scraper/utils"

const START_URL = "https://iccsydney.com.au/whats-on/"

export const iccSydneySource: ScraperSourceScript = {
  sourceName: "icc-sydney",
  startUrl: START_URL,
  city: "Sydney",
  countryCode: "AU",
  tags: ["conference-centre", "venue-events", "sydney"],
  scrape: async (page: Page) =>
    scrapeListingPage(page, {
      url: START_URL,
      sourceName: "icc-sydney",
      city: "Sydney",
      countryCode: "AU",
      tags: ["conference-centre", "venue-events", "sydney"],
      linkIncludes: ["/events/", "/whats-on/"],
      waitMs: 3500,
      limit: 60,
    }),
}
