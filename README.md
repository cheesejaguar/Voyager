# Voyager

**AI-powered travel planning that turns booking emails into a living itinerary.**

Voyager is a dark-mode, design-forward travel planning platform. Paste your flight and hotel confirmation emails, and the system automatically extracts structured trip details using LLMs. That information becomes a scaffolded trip timeline that evolves through the full travel lifecycle: pre-trip preparation, flights, active trip planning with AI recommendations, and post-trip photo memories.

---

## Features

### Email-to-Itinerary
Paste a flight or hotel confirmation email. AI classifies the email type (Haiku), then extracts structured booking data (Sonnet) with streaming feedback. Review the extracted fields and confirm to build your trip scaffold automatically.

### Pre-Trip Dashboard
- Countdown timer to departure
- AI-generated packing list tailored to destination, duration, and weather
- Pre-trip task checklist (visa, check-in, offline maps, adapters)
- Weather forecast via Open-Meteo
- Reservation summary with confirmation numbers

### Trip Planning
- **Daily Agenda** -- vertical timeline with activity cards, transit indicators, and inline add
- **Weekly Calendar** -- drag-and-drop via dnd-kit with 15-minute snap, cross-day moves, auto-recalculation
- **AI Recommendations** -- LLM-generated suggestions enriched with Foursquare data (ratings, photos, walking distance)
- **Map View** -- Mapbox GL dark mode with hotel markers, itinerary pins, and recommendation clusters
- **Preference Engine** -- 8 dimensions (vibe, focus, pace, budget, walking tolerance, etc.) shape recommendations

### Flight Dashboards
- Outbound and return flight cards with airline, times, terminal, gate
- Segment timeline with connection duration badges
- Tight connection warnings (< 90 min)
- Return flight leave-by calculator (checkout time - airport buffer)
- Premium: real-time flight status via AviationStack

### Post-Trip
- Photo upload with drag-and-drop, EXIF extraction (timestamp + GPS)
- Automatic photo-place association by GPS proximity or timestamp
- AI trip recap generation in 3 styles: concise, narrative, scrapbook
- Premium: Opus-quality recaps and shareable public pages

### Group Trips
- Invite members by email
- All members can view and edit the itinerary
- Owner manages membership

### Subscription
- Free: 3 trips, static flights, Sonnet recaps, 50 photos/trip
- Premium: unlimited trips, real-time flights, Opus recaps, 500 photos, shareable recaps
- Stripe Checkout with webhook-driven lifecycle management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Clerk (Vercel Marketplace) |
| Database | Neon Postgres + Drizzle ORM |
| AI | Vercel AI SDK v6 + AI Gateway |
| Maps | Mapbox GL JS |
| Weather | Open-Meteo (free, no API key) |
| Places | Foursquare Places API |
| Flights | AviationStack (premium) |
| DnD | dnd-kit |
| Animation | Framer Motion |
| Payments | Stripe |
| Storage | Vercel Blob |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Clerk](https://clerk.com) account (free tier works)
- A [Neon](https://neon.tech) database (free tier works)
- A [Vercel](https://vercel.com) account for AI Gateway + Blob storage

### Installation

```bash
git clone https://github.com/cheesejaguar/Voyager.git
cd Voyager
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Fill in the required values. See [Environment Variables](#environment-variables) below for details on each.

### Database Setup

```bash
npx drizzle-kit push
```

This creates all 14 tables in your Neon database.

### Clerk Webhook

Set up a webhook in your [Clerk Dashboard](https://dashboard.clerk.com) pointing to `https://your-domain.com/api/clerk/webhook` with events: `user.created`, `user.updated`, `user.deleted`.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Yes | Clerk webhook signing secret |
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `AI_GATEWAY_API_KEY` | Yes | Vercel AI Gateway API key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox access token |
| `FOURSQUARE_API_KEY` | For recs | Foursquare Places API key |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For billing | Stripe webhook signing secret |
| `STRIPE_PREMIUM_PRICE_ID` | For billing | Stripe price ID for premium plan |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For billing | Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | For billing | App URL for Stripe redirects |
| `BLOB_READ_WRITE_TOKEN` | For photos | Vercel Blob read/write token |
| `AVIATIONSTACK_API_KEY` | Premium | AviationStack flight status key |

---

## Project Structure

```
src/
  app/
    (auth)/                     # Sign-in / sign-up (Clerk)
    (app)/                      # Authenticated app
      dashboard/                # Trip list
      settings/                 # Account & subscription
      trip/[tripId]/
        overview/               # Trip overview + email import
        pre-trip/               # Countdown, packing, weather, checklist
        flight/[direction]/     # Outbound / return flight dashboard
        itinerary/              # Agenda + calendar views
        recommendations/        # AI recommendations
        map/                    # Mapbox map view
        photos/                 # Photo upload + gallery
        recap/                  # AI trip recap
    api/
      parse/                    # Email classification + extraction (streaming)
      recommend/                # Recommendation generation
      directions/               # Mapbox directions proxy
      photos/upload/            # Photo upload to Vercel Blob
      stripe/checkout/          # Stripe checkout session
      stripe/webhook/           # Stripe event handler
      clerk/webhook/            # Clerk user sync
  components/
    ui/                         # Design system (button, card, input, badge, dialog, skeleton, toast, motion)
    trip/                       # Trip components (cards, phase rail, packing, checklist, etc.)
    calendar/                   # Agenda + weekly calendar + DnD
    map/                        # Mapbox map components
    photos/                     # Upload dropzone, photo grid
    recommendations/            # Recommendation cards + list
  lib/
    ai/                         # LLM pipelines
      schemas.ts                # Zod schemas for extraction
      model-router.ts           # Model selection by task
      parse-email.ts            # Classify + extract
      generate-packing-list.ts  # AI packing list
      generate-pre-trip-tasks.ts # AI task checklist
      generate-recommendations.ts # AI recommendations
      generate-recap.ts         # AI trip recap
    db/
      schema.ts                 # Drizzle schema (14 tables)
      index.ts                  # Neon connection
      queries/                  # Per-entity query modules
    services/
      weather.ts                # Open-Meteo client
      mapbox.ts                 # Mapbox directions + geocoding
      foursquare.ts             # Foursquare Places search
      stripe.ts                 # Stripe helpers
    utils/
      trip-phases.ts            # Phase computation
      scaffold.ts               # Trip date/destination inference
      transit.ts                # Transit time calculation
      photo-association.ts      # GPS/timestamp photo matching
  types/
    trip.ts                     # Trip types
    preferences.ts              # Travel preference types
```

---

## Database Schema

14 tables covering the full data model:

- **users** -- synced from Clerk, stores subscription tier and preferences
- **subscriptions** -- Stripe subscription state
- **trips** -- core trip container with dates, destinations, status
- **trip_members** -- many-to-many user-trip membership with roles
- **import_documents** -- raw pasted email text + parsed JSON
- **flight_segments** -- individual flight legs with times, airports, terminals
- **hotel_stays** -- hotel bookings with check-in/check-out
- **itinerary_items** -- activities, meals, transit blocks on the daily timeline
- **recommendations** -- AI-generated suggestions with Foursquare enrichment
- **packing_items** -- checklist items per trip
- **pre_trip_tasks** -- preparation checklist items
- **photo_assets** -- uploaded photos with EXIF metadata
- **trip_summaries** -- generated recap content

---

## AI Model Routing

Voyager uses task-specific model selection via Vercel AI Gateway:

| Task | Model | Why |
|------|-------|-----|
| Email classification | Haiku 4.5 | Fast, cheap, high accuracy |
| Email extraction | Sonnet 4.5 | Handles varied formats |
| Packing list | Haiku 4.5 | Template-driven |
| Pre-trip tasks | Haiku 4.5 | Simple generation |
| Recommendations | Sonnet 4.5 | Preference reasoning |
| Trip recap (free) | Sonnet 4.5 | Good narrative |
| Trip recap (premium) | Opus 4.5 | Premium quality |

---

## Key Commands

```bash
npm run dev            # Start dev server
npm run build          # Production build
npm test               # Run tests (23 tests)
npm run test:watch     # Watch mode
npx drizzle-kit push   # Push schema to database
npx drizzle-kit studio # Open Drizzle Studio GUI
npx tsc --noEmit       # Type check
```

---

## Design System

**Palette: Warm Amber (Dark Mode)**

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0a0a` | Page background |
| Surface | `#141414` | Elevated panels |
| Card | `#1c1c1c` | Interactive cards |
| Accent | `#d9ab6f` | CTAs, highlights |
| Text Primary | `#e8e0d4` | Warm white body text |
| Text Secondary | `#999` | Secondary content |
| Text Muted | `#666` | Labels, captions |

**Category Colors** (desaturated for premium feel):
- Sightseeing: `#d9ab6f` (amber)
- Food/Dining: `#8bb88b` (sage)
- Culture/Museum: `#5ea0a0` (teal)
- Nightlife: `#b48cc8` (violet)
- Shopping: `#c88b8b` (coral)

**Typography:** Geist (Sans + Mono), shipped with Next.js

**Motion:** Framer Motion, 200ms micro-interactions, 400ms view transitions, no bounce

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard
4. Deploy

Vercel auto-detects Next.js and configures the build.

### Environment Variables on Vercel

Use the Vercel Marketplace to provision Clerk and Neon -- environment variables are auto-injected:

```bash
vercel integration add clerk
vercel integration add neon
```

For other variables, add them via the Vercel dashboard or CLI:

```bash
vercel env add STRIPE_SECRET_KEY
vercel env add AI_GATEWAY_API_KEY
# etc.
```

---

## Testing

```bash
npm test
```

23 tests covering:
- **Trip phase computation** (8 tests) -- all phase transitions, multi-segment, edge cases
- **Schema validation** (5 tests) -- Zod schemas for email classification, flight/hotel extraction
- **Scaffold generation** (10 tests) -- trip dates, flight direction inference, destination extraction

---

## License

MIT
