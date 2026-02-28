import { ScraperSourceScript } from "@/services/scraper/types"
import { cityOfSydneySource } from "@/services/scraper/sources/cityOfSydney"
import { sydneyComSource } from "@/services/scraper/sources/sydneyCom"
import { australiaComSource } from "@/services/scraper/sources/australiaCom"
import { iccSydneySource } from "@/services/scraper/sources/iccSydney"
import { eventbriteSource } from "@/services/scraper/sources/eventbrite"
import { predicthqAberdeenSource } from "@/services/scraper/sources/predicthq"

export const SCRAPER_SOURCES: ScraperSourceScript[] = [
  cityOfSydneySource,
  sydneyComSource,
  australiaComSource,
  iccSydneySource,
  eventbriteSource,
]

export const OPTIONAL_SCRAPER_SOURCES: ScraperSourceScript[] = [
  predicthqAberdeenSource,
]

export const ALL_SCRAPER_SOURCES: ScraperSourceScript[] = [
  ...SCRAPER_SOURCES,
  ...OPTIONAL_SCRAPER_SOURCES,
]
