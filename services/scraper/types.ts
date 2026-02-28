import { Page } from "playwright"

export type ScrapedEventInput = {
  title: string
  dateTime?: Date | null
  venueName?: string
  venueAddress?: string
  city: string
  description?: string
  categoryTags?: string[]
  imageUrl?: string
  sourceName: string
  originalUrl: string
}

export type ScraperSourceScript = {
  sourceName: string
  startUrl: string
  city: string
  countryCode: string
  tags: string[]
  scrape: (page: Page) => Promise<ScrapedEventInput[]>
}

export type ScrapePipelineResult = {
  sourceResults: Array<{
    sourceName: string
    fetched: number
    error?: string
  }>
  created: number
  updated: number
  unchanged: number
  inactivated: number
}
