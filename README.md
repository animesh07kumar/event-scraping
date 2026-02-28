# Event Scraping

This project implements the mandatory assignment requirements:

- Multi-source event scraping with dedicated source scripts:
  - `whatson.cityofsydney.nsw.gov.au`
  - `sydney.com/events`
  - `australia.com` events calendar
  - `iccsydney.com.au/whats-on`
  - `eventbrite` (Sydney listing)
  - `predicthq` Aberdeen major events (optional cross-country sample; may challenge bots)
- Automatic status tracking (`new`, `updated`, `inactive`, `imported`)
- Public event listing with `GET TICKETS` CTA
- Email + consent capture before redirecting to original event URL
- Google OAuth + protected dashboard
- Dashboard filters, table view, preview panel, import action, and source-level scrape selection

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- MongoDB + Mongoose
- NextAuth v5 (Google + credentials)
- Playwright (scraping)
- Nodemailer (OTP email)

## Setup

Create `event-scraping/.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
AUTH_SECRET=your_random_auth_secret

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password

CRON_SECRET=your_cron_secret
```

Install and run:

```bash
npm install
npm run dev
```

## Core Routes

- Public listing: `/`
- Sign in: `/signin`
- Dashboard (protected): `/dashboard`

API:

- `GET /api/events`
- `POST /api/events/:id/ticket`
- `POST /api/events/:id/import`
- `POST /api/scrape` (manual scrape, authenticated)
- `POST /api/cron/scrape` (scheduled scrape, `x-cron-secret` required)

To scrape selected sources only:

```http
POST /api/scrape
Content-Type: application/json

{
  "sources": ["cityofsydney", "eventbrite"]
}
```

## Scraping + Status Pipeline

`/api/scrape` and `/api/cron/scrape` run the pipeline:

1. Scrape source websites for Sydney events
2. Upsert events in MongoDB
3. Mark events as:
   - `new` when first discovered
   - `updated` when content changes
   - `inactive` when missing from source or expired
   - `imported` when imported from dashboard

