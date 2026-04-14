# Voyager

AI-powered travel planning web app.

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in env vars (see .env.example for required keys)
npm run dev
```

## Required Environment Variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk auth
- `CLERK_WEBHOOK_SECRET` — Clerk user sync webhook
- `DATABASE_URL` — Neon Postgres connection string
- `AI_GATEWAY_API_KEY` — Vercel AI Gateway
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox GL maps
- `FOURSQUARE_API_KEY` — Foursquare Places API
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PREMIUM_PRICE_ID` — Stripe billing
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage

## Stack

- Next.js 16 (App Router) on Vercel
- Clerk auth, Neon Postgres + Drizzle ORM
- AI SDK v6 + Vercel AI Gateway (Haiku for classification, Sonnet for extraction/recommendations)
- Mapbox GL JS, Open-Meteo weather, Foursquare Places
- dnd-kit for drag-and-drop calendar
- Framer Motion for animations
- Stripe for subscriptions
- Vercel Blob for photo storage

## Key Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
npm run test:watch   # Watch mode
npx drizzle-kit push # Push schema to database
npx drizzle-kit studio # Open Drizzle Studio
```

## Architecture

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components (ui/, trip/, calendar/, map/, photos/, recommendations/)
- `src/lib/ai/` — LLM pipelines (parsing, recommendations, packing, recap)
- `src/lib/db/` — Drizzle schema and query modules
- `src/lib/services/` — External API clients (Mapbox, weather, Foursquare, Stripe)
- `src/lib/utils/` — Pure utility functions (dates, phases, scaffold, transit)
- `src/types/` — Shared TypeScript types
- `src/app/actions/` — Server actions for mutations

## Design System

Warm amber dark-mode palette:
- Background: #0a0a0a, Surface: #141414, Card: #1c1c1c
- Accent: #d9ab6f (warm amber)
- Text: #e8e0d4 (primary), #999 (secondary), #666 (muted)
