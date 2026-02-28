type CityGuide = {
  city: string
  source: string
  extractionHint: string
}

type CountryGuide = {
  country: string
  flag: string
  theme: string
  summary: string
  cities: CityGuide[]
}

const COUNTRY_CITY_GUIDES: CountryGuide[] = [
  {
    country: "Australia",
    flag: "🇦🇺",
    theme: "from-sky-100 to-cyan-50",
    summary: "Primary assignment market with public city and tourism portals.",
    cities: [
      {
        city: "Sydney",
        source: "whatson.cityofsydney.nsw.gov.au",
        extractionHint: "JSON-LD Event blocks + `/events/` card links",
      },
      {
        city: "Sydney",
        source: "sydney.com/events",
        extractionHint: "Listing cards with title/time/location text nodes",
      },
      {
        city: "Sydney",
        source: "iccsydney.com.au/whats-on",
        extractionHint: "Venue event cards + structured metadata",
      },
    ],
  },
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    theme: "from-rose-100 to-slate-50",
    summary: "Cross-country expansion example using major-event signals.",
    cities: [
      {
        city: "Aberdeen",
        source: "predicthq.com/major-events/cities/gb/aberdeen",
        extractionHint: "Major-event cards + event detail links",
      },
      {
        city: "London",
        source: "eventbrite.com",
        extractionHint: "Search listing cards filtered by city slug",
      },
      {
        city: "Manchester",
        source: "eventbrite.com",
        extractionHint: "Card extraction with date + CTA link pattern",
      },
    ],
  },
  {
    country: "India",
    flag: "🇮🇳",
    theme: "from-amber-100 to-orange-50",
    summary: "Scalable pattern: same parser strategy across city pages.",
    cities: [
      {
        city: "Mumbai",
        source: "australia.com/events (calendar pattern example)",
        extractionHint: "Structured event schema + card fallback selectors",
      },
      {
        city: "Bengaluru",
        source: "eventbrite.com",
        extractionHint: "City-specific listing URL and `/e/` anchors",
      },
      {
        city: "Delhi",
        source: "eventbrite.com",
        extractionHint: "Time/location parsing from listing card text",
      },
    ],
  },
]

export default function CountryCityGuide() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Scraping Coverage Blueprint</h2>
        <p className="text-sm text-gray-600">
          Hover a country card to inspect popular cities and the data extraction pattern.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {COUNTRY_CITY_GUIDES.map((item) => (
          <article
            key={item.country}
            className="group rounded-2xl border bg-white/80 backdrop-blur-sm p-4 shadow-sm transition hover:shadow-md"
          >
            <div className={`rounded-xl bg-gradient-to-br ${item.theme} p-3`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{item.flag}</span>
                <div>
                  <h3 className="text-lg font-semibold">{item.country}</h3>
                  <p className="text-xs text-gray-600">{item.summary}</p>
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500 hidden md:block">
              Hover to reveal cities + extraction hints
            </div>

            <div className="mt-4 space-y-3 overflow-hidden max-h-96 md:max-h-0 md:group-hover:max-h-96 transition-all duration-300">
              {item.cities.map((city) => (
                <div key={`${item.country}-${city.city}`} className="rounded-lg border p-3 bg-gray-50">
                  <div className="text-sm font-medium">{city.city}</div>
                  <div className="text-xs text-gray-600">{city.source}</div>
                  <div className="text-xs text-gray-500 mt-1">{city.extractionHint}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
