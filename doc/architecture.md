# Voyager Architecture

## System Overview

Voyager is a monolithic Next.js 16 App Router application deployed on Vercel. It uses Server Components for data fetching, Client Components for interactive UI, Server Actions for mutations, and API routes for streaming AI operations and webhook handlers.

```
Browser
  |
  v
Next.js App Router (Vercel Functions)
  |
  +-- Server Components (data fetching)
  |     |-- Clerk auth (middleware)
  |     |-- Drizzle ORM queries
  |     |-- Neon Postgres
  |
  +-- Client Components (interactive UI)
  |     |-- dnd-kit (calendar drag-and-drop)
  |     |-- Mapbox GL JS (map rendering)
  |     |-- Framer Motion (animations)
  |
  +-- API Routes (streaming / webhooks)
  |     |-- /api/parse (AI email extraction, streaming)
  |     |-- /api/recommend (AI recommendations)
  |     |-- /api/directions (Mapbox proxy)
  |     |-- /api/photos/upload (Vercel Blob)
  |     |-- /api/stripe/* (Stripe webhooks)
  |     |-- /api/clerk/* (Clerk webhooks)
  |
  +-- Server Actions (mutations)
        |-- Trip CRUD
        |-- Booking confirmation
        |-- Itinerary management
        |-- Packing/task generation
        |-- Preferences
        |-- Recap generation
        |-- Member management
```

## Data Flow

### Email Import Flow

```
User pastes email text
  -> POST /api/parse
    -> classifyEmail() [Haiku 4.5, ~200ms]
      -> { type: "flight", confidence: 0.95 }
    -> extractFlightDetails() [Sonnet 4.5, streaming]
      -> streams structured JSON to client
  -> Client renders BookingReview card
  -> User clicks "Confirm & Add"
    -> confirmFlightBooking() server action
      -> createImportDocument()
      -> inferFlightDirection()
      -> createFlightSegments()
      -> updateTripScaffold()
        -> computeTripDates()
        -> computeDestinations()
        -> updateTripDates()
  -> revalidatePath() refreshes trip overview
```

### Recommendation Flow

```
User opens recommendations page
  -> Clicks "Generate Recommendations"
    -> POST /api/recommend
      -> Build context (destination, date, preferences, existing items)
      -> generateRecommendations() [Sonnet 4.5]
        -> 8 structured suggestions
      -> Foursquare enrichment (parallel)
        -> searchPlaces() for each suggestion
        -> getWalkingDirections() for distances
      -> Save to DB
      -> Return enriched recommendations
  -> User clicks "Add to Itinerary"
    -> addRecommendationToItinerary() server action
      -> createItineraryItem()
      -> updateRecommendationStatus("added")
```

### Drag-and-Drop Recalculation Flow

```
User drags activity block on weekly calendar
  -> DndContext onDragEnd fires
    -> Extract new date from droppable ID
    -> Calculate new time from vertical pixel position
    -> Snap to 15-minute grid
    -> moveItineraryItemAction() server action
      -> moveItineraryItem(id, newDate, newStartTime, newEndTime)
      -> revalidatePath()
  -> UI updates with new position
```

## Authentication Architecture

Clerk handles all auth. The flow:

1. `middleware.ts` intercepts all requests
2. Public routes (sign-in, sign-up, webhooks) are whitelisted
3. All other routes require authentication via `auth.protect()`
4. Server Components use `await auth()` to get the Clerk user ID
5. The Clerk user ID maps to an internal `users` table via `getUserByClerkId()`
6. All data queries are scoped through `trip_members` for authorization

### User Sync

Clerk webhooks keep the internal `users` table in sync:
- `user.created` -> creates internal user record
- `user.updated` -> updates email/name/avatar
- `user.deleted` -> cascading delete

## Database Architecture

### Connection

Neon Postgres via `@neondatabase/serverless` HTTP driver. The connection uses a lazy proxy pattern to avoid build-time failures when `DATABASE_URL` is not set:

```typescript
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Authorization Pattern

All data access is scoped through trip membership:

```typescript
// Every trip query joins through trip_members
const trip = await db
  .select()
  .from(tripMembers)
  .innerJoin(trips, eq(tripMembers.tripId, trips.id))
  .where(and(
    eq(tripMembers.userId, userId),
    isNotNull(tripMembers.joinedAt)
  ));
```

### Schema Organization

- Enums defined at top of schema.ts (11 enums)
- Tables defined with foreign keys and cascading deletes
- Relations defined for Drizzle's relational query API
- Queries organized by entity in `src/lib/db/queries/`

## AI Architecture

### Model Routing

Task-specific model selection minimizes cost:

| Tier | Model | Cost | Used For |
|------|-------|------|----------|
| A (Fast) | Haiku 4.5 | Cheapest | Classification, packing lists, task lists |
| B (Mid) | Sonnet 4.5 | Mid | Extraction, recommendations, recaps (free) |
| C (Premium) | Opus 4.5 | Expensive | Premium recaps only |

### Structured Output

All AI operations use Zod schemas for type-safe structured output:

```typescript
const { output } = await generateText({
  model: gateway(models.extract),
  output: Output.object({ schema: flightExtractionSchema }),
  prompt: `...`,
});
```

### Streaming

Email extraction streams results to the client via `streamText` + `toTextStreamResponse()`. The client reads the stream and parses the final JSON object.

## External Services

| Service | Purpose | Auth | Caching |
|---------|---------|------|---------|
| Open-Meteo | Weather forecasts | None (free) | 24h revalidate |
| Mapbox Directions | Walking times | Access token | Per-request |
| Mapbox GL JS | Map rendering | Access token (client) | N/A |
| Foursquare | Place enrichment | API key | Per-request |
| AviationStack | Flight status | API key | 5-min polling |
| Vercel Blob | Photo storage | R/W token | CDN-backed |
| Stripe | Billing | Secret key | Webhook-driven |

## Subscription Architecture

```
User clicks "Upgrade"
  -> POST /api/stripe/checkout
    -> Creates Stripe Checkout Session
    -> Returns session URL
  -> Browser redirects to Stripe
  -> User completes payment
  -> Stripe fires webhook
    -> POST /api/stripe/webhook
      -> checkout.session.completed
        -> Create subscription record
        -> Update users.subscription_tier = "premium"
  -> User redirected to /settings?upgraded=true

Subsequent events:
  -> customer.subscription.updated -> sync status
  -> customer.subscription.deleted -> downgrade to free
```

Feature gates are checked server-side before expensive operations:

```typescript
if (user.subscriptionTier !== "premium") {
  // Use Sonnet instead of Opus
  // Limit photo uploads
  // Static flight status only
}
```
