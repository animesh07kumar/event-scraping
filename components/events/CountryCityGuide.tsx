import Link from "next/link"

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
    summary: "Experience the magic of Australia—a land of ancient stories, world-class festivals, and iconic landscapes that create memories to last a lifetime.",
    cities: [
      {
        city: "Sydney",
        source: "whatson.cityofsydney.nsw.gov.au",
        extractionHint: "Experience the heartbeat of Australia’s global city, where the iconic Sydney Harbour transforms into a world-class stage for light, music, and creative ideas.",
      },
      {
        city: "Sydney",
        source: "sydney.com/events",
        extractionHint: "From the dazzle of Vivid Sydney 2026 to the prestige of the TCS Sydney Marathon, discover an unforgettable calendar of sport, art, and celebration.",
      },
      {
        city: "Sydney",
        source: "iccsydney.com.au/whats-on",
        extractionHint: "Connect at the epicentre of innovation, hosting Australia’s premier business summits, tech expos, and industry-leading networking events.",
      },
    ],
  },
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    theme: "from-rose-100 to-slate-50",
    summary: "Discover the magic of the UK through a year-round journey of iconic festivals, cultural celebrations, and industry-leading events.",
    cities: [
      {
        city: "Aberdeen",
        source: "predicthq.com/major-events/cities/gb/aberdeen",
        extractionHint: "Discover the Silver City by the sea, where centuries of maritime heritage blend with vibrant street art, spectacular coastal events, and global energy leadership.",
      },
      {
        city: "London",
        source: "eventbrite.com",
        extractionHint: "Experience the world’s stage in London, where historic landmarks meet cutting-edge festivals, West End glamour, and premier global summits.",
      },
      {
        city: "Manchester",
        source: "eventbrite.com",
        extractionHint: "Pulse with the energy of the UK’s cultural powerhouse, famous for its legendary music scene, world-class football, and the bold innovation of a city that never stops.",
      },
    ],
  },
  {
    country: "India",
    flag: "🇮🇳",
    theme: "from-amber-100 to-orange-50",
    summary: "Immerse yourself in Incredible India, a vibrant land where ancient traditions and colourful festivals create a symphony of unforgettable experiences.",
    cities: [
      {
        city: "Mumbai",
        source: "australia.com/events (calendar pattern example)",
        extractionHint: "The City of Dreams where Bollywood glamour meets global finance, hosting everything from star-studded premieres to the iconic Kala Ghoda Arts Festival.",
      },
      {
        city: "Bengaluru",
        source: "eventbrite.com",
        extractionHint: "Step into India’s Silicon Valley, a high-energy hub for groundbreaking tech expos, vibrant music festivals, and a legendary craft beer and cafe culture.",
      },
      {
        city: "Delhi",
        source: "eventbrite.com",
        extractionHint: "A powerful blend of ancient history and modern governance, where grand Republic Day parades meet international trade fairs and a world-renowned culinary and arts scene.",
      },
    ],
  },
]

export default function CountryCityGuide() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Country And City</h2>
        <p className="text-sm text-gray-600">
          Select city, To open in Dashboard.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {COUNTRY_CITY_GUIDES.map((item) => (
          <article
            key={item.country}
            className="rounded-2xl border bg-white/80 backdrop-blur-sm p-4 shadow-sm transition hover:shadow-md"
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

            <div className="mt-4 space-y-3">
              {item.cities.map((city) => (
                <Link
                  key={`${item.country}-${city.city}-${city.source}`}
                  href={`/dashboard?city=${encodeURIComponent(city.city)}`}
                  className="block rounded-lg border p-3 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="text-sm font-medium">{city.city}</div>
                  <div className="text-xs text-gray-600">{city.source}</div>
                  <div className="text-xs text-gray-500 mt-1">{city.extractionHint}</div>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
