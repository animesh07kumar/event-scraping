import { Page } from "playwright"
import { ScraperSourceScript } from "@/services/scraper/types"
import { scrapeListingPage } from "@/services/scraper/utils"

const START_URL = "https://www.predicthq.com/major-events/cities/gb/aberdeen"

export const predicthqAberdeenSource: ScraperSourceScript = {
  sourceName: "predicthq-aberdeen",
  startUrl: START_URL,
  city: "Aberdeen",
  countryCode: "GB",
  tags: ["major-events", "insights", "aberdeen"],
  scrape: async (page: Page) =>
    scrapeListingPage(page, {
      url: START_URL,
      sourceName: "predicthq-aberdeen",
      city: "Aberdeen",
      countryCode: "GB",
      tags: ["major-events", "insights", "aberdeen"],
      linkIncludes: ["/major-events/", "/events/"],
      waitMs: 3000,
      limit: 40,
    }),
}
