# Voyager MVP Design Spec

## Context

Trip planning is fragmented across email, airline apps, hotel apps, maps, and notes. Travelers manually reconstruct itineraries from confirmation emails and constantly switch between tools. Voyager solves this by letting users paste booking confirmation emails, automatically extracting structured trip data via LLMs, and building a living itinerary that spans the full travel lifecycle: pre-trip preparation, flights, active trip planning, and post-trip photo/recap.

This spec covers the complete MVP: all five travel lifecycle phases, the recommendation engine, subscription tiers, and the visual design system.

---

## 1. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) | Server Components, streaming, Vercel-native |
| Language | TypeScript | Type safety across full stack |
| Styling | Tailwind CSS v4 | Utility-first, design token support |
| Deployment | Vercel (Fluid Compute) | Serverless functions, edge-ready |
| Database | Neon Postgres (Vercel Marketplace) | Serverless-friendly, branching, auto-scaling |
| ORM | Drizzle ORM | Lightweight, type-safe, SQL-like, great migrations |
| Auth | Clerk (Vercel Marketplace) | OAuth + email/password, auto-provisioned env vars |
| Billing | Stripe | Subscription management, Checkout, webhooks |
| Blob Storage | Vercel Blob | Photo uploads, CDN-backed |
| AI/LLM | Vercel AI SDK v6 + AI Gateway | Unified multi-provider access, observability |
| Maps | Mapbox GL JS | Dark-mode styles, directions API, POI |
| Weather | Open-Meteo | Free, no API key, 7-day forecasts |
| Places | Foursquare Places API | POI enrichment, generous free tier |
| Flight Status | AviationStack (premium only) | Real-time status, free tier 100 req/month |
| DnD | dnd-kit | Drag-and-drop primitives, custom calendar |
| Animation | Framer Motion | Smooth transitions, gesture support |
| Icons | Lucide React | Consistent, clean icon set |
| Dates | date-fns | Lightweight date manipulation |

---

## 2. Project Structure

```
src/
  app/
    (auth)/
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
    (app)/
      layout.tsx                 # Authenticated shell with sidebar
      dashboard/page.tsx         # Trip list / home
      trip/[tripId]/
        layout.tsx               # Trip shell with phase nav
        overview/page.tsx
        pre-trip/page.tsx
        flight/[direction]/page.tsx   # direction: outbound | return
        itinerary/page.tsx       # Agenda + Calendar views
        recommendations/page.tsx
        map/page.tsx
        photos/page.tsx
        recap/page.tsx
      settings/page.tsx
    api/
      parse/route.ts             # Email parsing (streaming)
      recommend/route.ts         # Recommendation generation
      weather/route.ts           # Open-Meteo proxy
      flights/[flightId]/route.ts  # AviationStack proxy (premium)
      stripe/
        checkout/route.ts        # Create checkout session
        webhook/route.ts         # Stripe webhook handler
      clerk/webhook/route.ts     # Clerk user sync webhook
  components/
    ui/                          # Design system primitives
      button.tsx
      card.tsx
      badge.tsx
      input.tsx
      textarea.tsx
      dialog.tsx
      dropdown.tsx
      skeleton.tsx
      tooltip.tsx
    trip/                        # Trip-specific components
      trip-card.tsx
      phase-rail.tsx
      flight-card.tsx
      hotel-card.tsx
      booking-review.tsx
      countdown.tsx
      packing-list.tsx
      checklist.tsx
    calendar/                    # Calendar/DnD system
      weekly-calendar.tsx
      day-column.tsx
      time-grid.tsx
      activity-block.tsx
      transit-block.tsx
      gap-indicator.tsx
    map/                         # Map components
      trip-map.tsx
      recommendation-pin.tsx
      filter-sidebar.tsx
    photos/                      # Photo components
      upload-dropzone.tsx
      photo-grid.tsx
      day-photo-group.tsx
    recommendations/             # Recommendation components
      recommendation-card.tsx
      suggestion-bubble.tsx
  lib/
    ai/
      parse-email.ts             # Email classification + extraction
      generate-packing-list.ts   # Packing list generation
      generate-recommendations.ts # Recommendation generation
      generate-recap.ts          # Trip recap generation
      schemas.ts                 # Zod schemas for structured output
      prompts.ts                 # Prompt templates
      model-router.ts            # Model selection by task tier
    db/
      schema.ts                  # Drizzle schema definitions
      index.ts                   # DB connection
      queries/                   # Query modules per entity
        trips.ts
        flights.ts
        hotels.ts
        itinerary.ts
        recommendations.ts
        photos.ts
        users.ts
        subscriptions.ts
    services/
      mapbox.ts                  # Mapbox directions + geocoding
      weather.ts                 # Open-Meteo client
      foursquare.ts              # Foursquare Places client
      aviation-stack.ts          # AviationStack client
      stripe.ts                  # Stripe helpers
    utils/
      dates.ts                   # Date/timezone utilities
      trip-phases.ts             # Phase computation logic
      transit.ts                 # Transit time calculations
  hooks/
    use-trip.ts                  # Trip data + mutations
    use-itinerary.ts             # Itinerary CRUD
    use-recommendations.ts       # Recommendation fetching
    use-subscription.ts          # Subscription status
  types/
    trip.ts                      # Shared trip types
    itinerary.ts                 # Itinerary types
    recommendation.ts            # Recommendation types
```

---

## 3. Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| clerk_id | text | Unique, from Clerk webhook |
| email | text | Not null |
| name | text | |
| avatar_url | text | |
| subscription_tier | enum('free','premium') | Default 'free' |
| preferences | jsonb | Travel preferences (pace, budget, etc.) |
| created_at | timestamp | Default now() |
| updated_at | timestamp | |

### subscriptions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK -> users |
| stripe_customer_id | text | |
| stripe_subscription_id | text | |
| plan | enum('free','premium') | |
| status | enum('active','canceled','past_due','trialing') | |
| current_period_start | timestamp | |
| current_period_end | timestamp | |
| created_at | timestamp | |

### trips
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | User-editable trip name |
| start_date | date | Earliest departure |
| end_date | date | Latest return |
| destinations | text[] | Array of city/country strings |
| status | enum('planning','active','completed','archived') | |
| preference_overrides | jsonb | Trip-level preference overrides, nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### trip_members
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| user_id | uuid | FK -> users |
| role | enum('owner','member') | |
| invited_at | timestamp | |
| joined_at | timestamp | Null until accepted |

### import_documents
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| raw_text | text | Original pasted email content |
| source_type | enum('flight','hotel','activity','unknown') | LLM-classified |
| parsed_json | jsonb | Structured extraction result |
| confidence | real | 0.0 - 1.0 overall confidence |
| status | enum('pending','reviewed','confirmed','rejected') | |
| created_at | timestamp | |

### flight_segments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| import_document_id | uuid | FK -> import_documents, nullable |
| airline | text | |
| flight_number | text | |
| confirmation_code | text | |
| passenger_names | text[] | |
| departure_airport | text | IATA code |
| arrival_airport | text | IATA code |
| departure_time | timestamptz | With timezone |
| arrival_time | timestamptz | With timezone |
| terminal | text | Nullable |
| gate | text | Nullable |
| cabin_class | text | Nullable |
| seat | text | Nullable |
| connection_group | text | Groups multi-leg flights |
| direction | enum('outbound','return') | Inferred: first half of segments = outbound, second half = return. User can override in review. |
| status | text | Default 'scheduled' |
| sort_order | integer | Order within connection group |

### hotel_stays
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| import_document_id | uuid | FK -> import_documents, nullable |
| hotel_name | text | |
| address | text | |
| confirmation_number | text | |
| check_in | timestamptz | |
| check_out | timestamptz | |
| room_type | text | Nullable |
| guest_count | integer | Nullable |
| contact_info | text | Nullable |
| latitude | real | Nullable, for map placement |
| longitude | real | Nullable |

### itinerary_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| date | date | |
| start_time | time | |
| end_time | time | |
| type | enum('activity','meal','transit','free_time','custom') | |
| title | text | |
| description | text | Nullable |
| location_name | text | Nullable |
| latitude | real | Nullable |
| longitude | real | Nullable |
| category | text | E.g., 'museum', 'restaurant', 'walking_tour' |
| source | enum('manual','recommendation','import') | |
| notes | text | Nullable, user notes |
| sort_order | integer | For ordering within same time |
| transit_duration_min | integer | Nullable, minutes from previous item |
| created_at | timestamp | |
| updated_at | timestamp | |

### recommendations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| target_date | date | Which day this is for |
| name | text | |
| category | text | |
| description | text | |
| rationale | text | Why this fits |
| estimated_duration_min | integer | |
| distance_from_anchor | text | E.g., "12-min walk" |
| latitude | real | Nullable |
| longitude | real | Nullable |
| rating | real | From Foursquare, nullable |
| price_level | integer | 1-4, nullable |
| foursquare_id | text | Nullable |
| photo_url | text | Nullable |
| status | enum('suggested','saved','added','dismissed') | |
| created_at | timestamp | |

### packing_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| text | text | Item description |
| category | text | E.g., 'clothing', 'tech', 'toiletries' |
| checked | boolean | Default false |
| sort_order | integer | |

### pre_trip_tasks
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| text | text | Task description |
| completed | boolean | Default false |
| due_description | text | E.g., "24 hours before departure" |
| sort_order | integer | |

### photo_assets
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| blob_url | text | Vercel Blob URL |
| filename | text | |
| taken_at | timestamptz | From EXIF, nullable |
| gps_latitude | real | From EXIF, nullable |
| gps_longitude | real | From EXIF, nullable |
| associated_date | date | Inferred or manual |
| associated_itinerary_item_id | uuid | FK -> itinerary_items, nullable |
| created_at | timestamp | |

### trip_summaries
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK -> trips |
| style | enum('concise','narrative','scrapbook') | |
| content | text | Generated markdown/HTML |
| is_public | boolean | Default false |
| public_slug | text | Nullable, for sharing |
| created_at | timestamp | |

---

## 4. Email Parsing Pipeline

### Flow

```
User pastes email text
  -> POST /api/parse (streaming response)
    -> Step 1: Classification (Haiku 4.5)
       Input: raw email text
       Output: { type: 'flight' | 'hotel' | 'activity' | 'unknown', confidence: number }

    -> Step 2: Extraction (Sonnet 4.6, structured output)
       Input: raw email text + classified type
       Output: structured JSON matching FlightExtraction or HotelExtraction Zod schema
       Each field has a confidence score

    -> Step 3: Deduplication check
       Query existing trip bookings by confirmation number
       If duplicate found, return existing with match flag

    -> Step 4: Return to client
       Stream classification result immediately
       Stream extraction fields as they resolve
       Highlight low-confidence fields (< 0.7)

  -> Client shows review card
    -> User confirms or edits fields
    -> POST to save confirmed booking

  -> Server: scaffold generation
    -> Compute trip date bounds
    -> Create day containers
    -> Insert flight/hotel anchors
    -> Detect gaps between anchors
    -> Set initial trip phase
```

### Zod Schemas

**FlightExtraction:**
```typescript
z.object({
  airline: z.string(),
  flightNumber: z.string(),
  confirmationCode: z.string(),
  passengerNames: z.array(z.string()),
  segments: z.array(z.object({
    departureAirport: z.string(),
    arrivalAirport: z.string(),
    departureTime: z.string(),  // ISO 8601
    arrivalTime: z.string(),
    terminal: z.string().optional(),
    gate: z.string().optional(),
    cabinClass: z.string().optional(),
    seat: z.string().optional(),
  })),
})
```

**HotelExtraction:**
```typescript
z.object({
  hotelName: z.string(),
  address: z.string(),
  confirmationNumber: z.string(),
  checkIn: z.string(),  // ISO 8601
  checkOut: z.string(),
  roomType: z.string().optional(),
  guestCount: z.number().optional(),
  contactInfo: z.string().optional(),
})
```

### Model Routing

| Task | Model | Rationale |
|------|-------|-----------|
| Email classification | Haiku 4.5 | Fast, cheap, high accuracy for simple classification |
| Field extraction | Sonnet 4.6 | Structured output, handles varied email formats |
| Extraction retry (on failure) | Opus 4.6 | Escalation for ambiguous/complex emails |
| Packing list generation | Haiku 4.5 | Template-driven, fast |
| Pre-trip task suggestions | Haiku 4.5 | Simple contextual generation |
| Activity recommendations | Sonnet 4.6 | Needs reasoning about preferences + context |
| Itinerary conflict resolution | Sonnet 4.6 | Schedule reasoning |
| Trip recap (free tier) | Sonnet 4.6 | Good narrative quality |
| Trip recap (premium) | Opus 4.6 | Premium narrative quality |
| Photo-place inference | Sonnet 4.6 | Spatial/temporal reasoning |

---

## 5. Trip Phases & Navigation

### Phase Model

Phases are computed, not manually set:

```typescript
function computePhase(trip: Trip, now: Date): TripPhase {
  const outboundDeparture = trip.flights
    .filter(f => f.direction === 'outbound')
    .sort((a, b) => a.departureTime - b.departureTime)[0]?.departureTime;

  const outboundArrival = trip.flights
    .filter(f => f.direction === 'outbound')
    .sort((a, b) => b.arrivalTime - a.arrivalTime)[0]?.arrivalTime;

  const returnDeparture = trip.flights
    .filter(f => f.direction === 'return')
    .sort((a, b) => a.departureTime - b.departureTime)[0]?.departureTime;

  const returnArrival = trip.flights
    .filter(f => f.direction === 'return')
    .sort((a, b) => b.arrivalTime - a.arrivalTime)[0]?.arrivalTime;

  if (!outboundDeparture || now < outboundDeparture) return 'pre_trip';
  if (now < outboundArrival) return 'outbound_flight';
  if (!returnDeparture || now < returnDeparture) return 'trip';
  if (now < returnArrival) return 'return_flight';
  return 'post_trip';
}
```

### Navigation Structure

**App Shell Sidebar:**
- Voyager logo
- Dashboard (trip list)
- Current trip name (if in trip context)
- Saved Places
- Settings
- User avatar + subscription badge

**Trip Phase Rail (vertical, left side within trip):**
- Overview (always visible)
- Pre-Trip (countdown badge)
- Outbound Flight (airline icon)
- Trip (calendar icon, current phase highlighted)
- Return Flight (airline icon)
- Post-Trip (camera icon)

**Trip Sub-Navigation (horizontal tabs within Trip phase):**
- Agenda | Calendar | Map | Recommendations

---

## 6. Recommendation Engine

### Architecture

```
User opens day view or requests suggestions
  -> POST /api/recommend
    -> Build context:
       - Destination city
       - Target date
       - User preferences (from trip or day override)
       - Existing itinerary for that day (time gaps)
       - Weather forecast for that date
       - Hotel location (anchor point)

    -> Stage 1: LLM Generation (Sonnet 4.6)
       - Structured output: array of RecommendationSchema
       - 5-10 suggestions per request
       - Each includes: name, category, description, rationale,
         estimated_duration, why_it_fits

    -> Stage 2: Foursquare Enrichment
       - Match each suggestion name + city against Foursquare
       - Enrich with: rating, hours, photos, coordinates, price_level
       - Calculate distance from hotel using Mapbox

    -> Return enriched recommendations to client
```

### Preference Inputs

Stored in `users.preferences` (global), overridable per trip (in `trips` table as `preference_overrides` jsonb column), and per-day via query parameter to the recommendation API (not persisted — day-level overrides are session-only):

```typescript
interface TravelPreferences {
  vibe: 'touristy' | 'local' | 'mixed';
  focus: 'food' | 'sightseeing' | 'culture' | 'nightlife' | 'balanced';
  diningStyle: 'fine_dining' | 'casual' | 'street_food' | 'mixed';
  pace: 'packed' | 'balanced' | 'relaxed';
  budget: 'budget' | 'moderate' | 'luxury';
  walkingTolerance: 'minimal' | 'moderate' | 'high';
  transitPreference: 'walk' | 'transit' | 'rideshare' | 'mixed';
  indoorOutdoor: 'indoor' | 'outdoor' | 'mixed';
}
```

### Recommendation Card Data

```typescript
interface RecommendationCard {
  id: string;
  name: string;
  category: string;         // 'museum', 'restaurant', 'park', etc.
  description: string;      // 1-2 sentence description
  rationale: string;        // "8-min walk from your hotel"
  estimatedDurationMin: number;
  distanceFromAnchor: string;
  rating?: number;          // From Foursquare
  priceLevel?: number;      // 1-4
  photoUrl?: string;        // From Foursquare
  latitude?: number;
  longitude?: number;
}
```

---

## 7. Calendar & Itinerary System

### Daily Agenda View

- Vertical timeline for one day
- Time markers on left rail (6AM-11PM)
- Cards stacked chronologically:
  - Hotel anchor (wake up / return)
  - Activity blocks with category color coding
  - Meal blocks
  - Transit indicators between items (showing duration)
  - Free-time gaps with "+" button to add recommendations
- Click card to expand inline editor
- Inline "Add suggestion" in gaps

### Weekly Calendar View (dnd-kit)

- 7-column grid (one per day)
- Time rows from 6AM-11PM, 15-minute increments
- Activity cards positioned by start_time, height by duration
- Color-coded by category:
  - Sightseeing: muted amber
  - Food/dining: muted sage
  - Culture/museum: muted teal
  - Nightlife: muted violet
  - Transit: dark gray
  - Custom: muted coral

**Drag-and-drop behaviors:**
- Drag within day: reposition in time
- Drag between days: move to different date
- Resize bottom edge: change duration
- Snap to 15-minute grid
- Ghost preview during drag

**Recalculation on move:**
1. Get coordinates of moved item and its new neighbors
2. Call Mapbox Directions API for transit times (walking by default)
3. Update transit blocks between affected items
4. Check for time overlaps
5. If overlap detected: highlight conflicting items in red, show tooltip with options (swap, extend gap, remove)
6. Optimistic UI: update immediately, reconcile with server response

### Map View

- Mapbox GL JS with dark style (`mapbox://styles/mapbox/dark-v11`)
- Hotel marker (amber, prominent)
- Itinerary items as pins (color-coded by category)
- Recommendation clusters as smaller markers
- Click pin: show recommendation card overlay
- Filter sidebar: category toggles, distance slider, duration range
- "Add to Day X" button on each card

---

## 8. Pre-Trip Dashboard

### Modules

**Countdown:**
- Large countdown to departure (days, hours)
- Departure date, time, and airport

**Weather Preview:**
- Cards per destination showing forecast for trip dates
- High/low temperature, conditions icon, precipitation chance
- Data from Open-Meteo, refreshed daily

**Packing List:**
- Generated by Haiku 4.5 based on: trip duration, destination weather, planned activities, user style preference
- Grouped by category: clothing, tech, toiletries, documents, misc
- Checkable items, persisted
- Regenerate button (re-runs AI with updated context)
- Manual add/remove items

**Pre-Trip Tasks:**
- AI-suggested checklist (Haiku 4.5):
  - Check in for flight (24h before)
  - Verify passport expiration
  - Check visa requirements
  - Download offline maps
  - Pack power adapters
  - Confirm restaurant reservations
  - Arrange ground transportation
- Checkable, persisted
- Manual add/remove

**Reservation Summary:**
- All flights and hotels in compact card format
- Quick reference for confirmation numbers

---

## 9. Flight Phase Dashboard

### Layout

- Flight card: airline logo placeholder, flight number, route, times, terminal/gate
- Segment timeline: visual horizontal timeline showing each leg
- Connection tracker: duration between segments, tight connection warnings

### Status (tier-dependent)

**Free tier:**
- Static display from extracted email data
- No live updates
- Status shows "Scheduled" unless manually updated

**Premium tier:**
- AviationStack polling every 5 minutes during travel day
- Status updates: on-time, delayed, departed, landed, canceled
- Estimated vs actual times
- Gate changes

### Connection Intelligence

- If connection < 60 min (domestic) or < 90 min (international): red warning badge
- If layover > 3 hours: suggest airport amenities (LLM-generated based on airport code)

### Return Flight

- Same layout as outbound
- Additional module: "Leave by" time calculator
  - Hotel checkout time
  - Estimated transit to airport (Mapbox Directions)
  - Recommended buffer (2h domestic, 3h international)
  - Computed "leave hotel by" time

---

## 10. Post-Trip System

### Photo Upload

- Drag-and-drop upload zone (multi-file)
- Uploads to Vercel Blob (private storage)
- Client-side EXIF extraction before upload (exifr library):
  - Timestamp (DateTimeOriginal)
  - GPS coordinates
- Progressive display: show thumbnail immediately, process metadata async

### Photo-Place Association

- Photos with GPS: match to nearest itinerary item by coordinates
- Photos with timestamp only: assign to day, suggest nearest-time activity
- Photos with neither: assign to "Unassigned" for manual placement
- User can drag photos between day groups and place assignments

### Trip Recap Generation

**Styles:**
- **Concise**: Bullet-point summary of highlights
- **Narrative**: Journal-style prose, day-by-day
- **Scrapbook**: Short captions paired with photo selections

**Input to LLM:**
- Trip metadata (dates, destinations)
- Full itinerary (what was actually done)
- Photo associations (which places have photos)
- User can add "highlights" or "favorite moments" before generation

**Model selection:**
- Free tier: Sonnet 4.6
- Premium tier: Opus 4.6

**Output:** Markdown content stored in `trip_summaries` table. Rendered in app with trip photos interspersed. Optional public sharing via unique slug URL.

---

## 11. Group Trip Support

### Invitation Flow

1. Trip owner enters email address to invite
2. System checks if email matches a Clerk user
   - If yes: create `trip_member` record with `joined_at = null`, send email notification via Clerk
   - If no: send email invitation with signup link + trip join token (via Clerk invitation API)
3. Invitee signs up or logs in, clicks accept
4. `trip_member.joined_at` is set, member gains access

### Permissions

- **Owner**: Full control. Can edit trip, invite/remove members, delete trip, manage billing
- **Member**: Can view and edit itinerary, add recommendations, upload photos, edit packing list. Cannot delete trip, manage members, or change trip settings

### Data Scoping

- All trip queries filter by `trip_members` membership, not just `trips.user_id`
- Trip list on dashboard shows all trips where user is owner or member
- Member role badge shown on shared trips

---

## 12. Subscription Model

### Tiers

| Feature | Free | Premium |
|---------|------|---------|
| Active trips | 3 | Unlimited |
| Flight status | Static | Real-time (AviationStack) |
| Recap quality | Sonnet 4.6 | Opus 4.6 |
| Recommendation enrichment | Standard | Priority (faster, more results) |
| Photo uploads per trip | 50 | 500 |
| Shareable recap pages | No | Yes |

### Stripe Integration

- `POST /api/stripe/checkout`: Create Stripe Checkout session for premium upgrade
- `POST /api/stripe/webhook`: Handle subscription lifecycle events
  - `checkout.session.completed`: Create subscription record, update user tier
  - `customer.subscription.updated`: Sync plan/status changes
  - `customer.subscription.deleted`: Downgrade to free
- User tier stored in both `subscriptions` table and `users.subscription_tier` for fast reads
- Feature gates checked server-side:
  ```typescript
  function requirePremium(userId: string) {
    const user = await getUser(userId);
    if (user.subscriptionTier !== 'premium') {
      throw new Error('Premium required');
    }
  }
  ```

---

## 13. Visual Design System

### Color Palette: Warm Amber

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0a0a0a` | Page background |
| `--surface` | `#141414` | Elevated panels, sidebar |
| `--card` | `#1c1c1c` | Cards, interactive elements |
| `--card-hover` | `#242424` | Card hover state |
| `--border` | `rgba(255,255,255,0.06)` | Subtle borders |
| `--accent` | `#d9ab6f` | Primary accent (CTAs, active states, highlights) |
| `--accent-muted` | `rgba(217,171,111,0.12)` | Accent backgrounds |
| `--text-primary` | `#e8e0d4` | Primary text (warm white) |
| `--text-secondary` | `#999999` | Secondary text |
| `--text-muted` | `#666666` | Tertiary text, labels |

### Category Colors (desaturated for premium feel)

| Category | Color | Token |
|----------|-------|-------|
| Sightseeing | Muted amber | `#d9ab6f` |
| Food/Dining | Muted sage | `#8bb88b` |
| Culture/Museum | Muted teal | `#5ea0a0` |
| Nightlife | Muted violet | `#b48cc8` |
| Shopping | Muted coral | `#c88b8b` |
| Transit | Dark gray | `#4a4a4a` |

### Status Colors

| Status | Color |
|--------|-------|
| Success | `#6b9b6b` (muted green) |
| Warning | `#c8a86b` (warm yellow) |
| Error | `#b86b6b` (muted red) |
| Info | `#6b8fb8` (muted blue) |

### Typography

- **Font**: Geist (Vercel's font, ships with Next.js)
- **Headings**: Geist, weight 600, tracking -0.02em
- **Body**: Geist, weight 400, 15px/1.6
- **Labels/Badges**: Geist, weight 500, 11px, letter-spacing 0.05em, uppercase
- **Monospace** (times, codes): Geist Mono

### Motion

- **Micro-interactions**: 200ms, ease-out
- **View transitions**: 400ms, ease-in-out
- **Drag feedback**: spring physics via Framer Motion
- **No bounce** — smooth and deliberate
- **Page transitions**: fade + subtle vertical slide (20px)

### Key UI Patterns

- **Phase rail**: Vertical progress spine on trip sidebar, current phase glows amber
- **Expandable cards**: Click to expand detail, smooth height animation
- **Floating recommendation bubbles**: Appear in itinerary gaps, pulse subtly
- **Drag-and-drop calendar**: Ghost card during drag, drop zone highlights
- **Split-view**: Map + schedule side by side on trip page
- **Photo strip**: Horizontal scroll of photos on recap page

---

## 14. API Route Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/parse` | POST | Email classification + extraction (streaming) | Required |
| `/api/recommend` | POST | Generate recommendations for a day | Required |
| `/api/weather` | GET | Weather forecast proxy | Required |
| `/api/flights/[id]` | GET | Flight status (premium) | Premium |
| `/api/stripe/checkout` | POST | Create Stripe checkout session | Required |
| `/api/stripe/webhook` | POST | Stripe event handler | Stripe signature |
| `/api/clerk/webhook` | POST | Clerk user sync | Clerk signature |

All other data operations (trips, itinerary CRUD, photo upload, etc.) use Next.js Server Actions for simpler client-server communication.

---

## 15. Verification Plan

### Unit Tests
- Drizzle schema validation (all tables create successfully)
- Trip phase computation logic (all edge cases)
- Email parsing Zod schema validation
- Preference merging (global + trip + day overrides)

### Integration Tests
- Email paste -> classification -> extraction -> review -> confirm -> scaffold
- Add recommendation to itinerary -> transit recalculation
- Photo upload -> EXIF extraction -> day assignment
- Stripe checkout -> webhook -> subscription update -> feature gate

### E2E Tests (Playwright)
- Full trip creation flow: sign up -> create trip -> paste email -> confirm bookings -> see itinerary
- Calendar drag-and-drop: drag item to new day, verify recalculation
- Recommendation flow: open day view -> see suggestions -> add to itinerary
- Photo upload: upload photos -> verify day grouping -> generate recap
- Subscription upgrade: click upgrade -> Stripe checkout -> verify premium features

### Manual Verification
- Paste real airline confirmation emails (United, Delta, American, Southwest, international carriers)
- Paste real hotel confirmation emails (Marriott, Hilton, Airbnb, Booking.com)
- Verify dark-mode aesthetics in Chrome, Safari, Firefox
- Test responsive behavior on tablet-width screens
- Verify Mapbox dark style rendering with pins and routes

---

## 16. Build Order

This is the recommended implementation sequence, with each phase building on the previous:

### Phase 1: Foundation (Weeks 1-3)
1. Next.js project setup with Tailwind, Geist font, design tokens
2. Clerk auth integration (sign-in, sign-up, middleware)
3. Neon Postgres + Drizzle schema setup and migrations
4. Basic app shell: sidebar, routing, authenticated layout
5. Trip CRUD: create, list, rename, delete
6. Trip member model (owner auto-added on creation)

### Phase 2: Email Parsing & Scaffold (Weeks 4-5)
7. Email paste UI component
8. AI parsing pipeline: classification + extraction + streaming
9. Booking review card UI
10. Scaffold generation: date bounds, day containers, anchor events
11. Trip overview page with timeline

### Phase 3: Pre-Trip & Flights (Weeks 6-7)
12. Pre-trip dashboard: countdown, weather, reservation summary
13. Packing list generation and checklist
14. Pre-trip task generation and checklist
15. Flight phase dashboard: flight cards, segment timeline
16. Return flight: leave-by calculator

### Phase 4: Trip Planning Core (Weeks 8-11)
17. Daily agenda view with itinerary items
18. Weekly calendar view with dnd-kit
19. Drag-and-drop behaviors: move, resize, snap
20. Transit recalculation via Mapbox
21. Recommendation engine: LLM generation + Foursquare enrichment
22. Recommendation cards and add-to-itinerary flow
23. Preference engine UI and integration
24. Map view with Mapbox and POI pins

### Phase 5: Post-Trip & Subscription (Weeks 12-14)
25. Photo upload with Vercel Blob
26. EXIF extraction and day/place association
27. Trip recap generation (multiple styles)
28. Shareable recap pages
29. Stripe subscription integration
30. Feature gates (premium vs free)
31. Group trip: invite, accept, member permissions

### Phase 6: Polish (Weeks 15-16)
32. Framer Motion animations throughout
33. Loading states and skeleton screens
34. Error boundaries and graceful fallbacks
35. Responsive adjustments
36. Final design system audit
