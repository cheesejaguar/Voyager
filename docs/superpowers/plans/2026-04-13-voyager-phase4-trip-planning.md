# Voyager Phase 4: Trip Planning Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Build the active trip planning experience — daily agenda, weekly drag-and-drop calendar, recommendation engine with Foursquare enrichment, map view with Mapbox, and transit recalculation.

**Architecture:** dnd-kit for drag-and-drop calendar, Mapbox GL JS for maps/directions, AI SDK + Foursquare for recommendations, Server Actions for mutations, optimistic UI for drag operations.

**Spec:** `docs/superpowers/specs/2026-04-13-voyager-mvp-design.md` sections 6, 7, 9.6, 9.7, 9.8

---

## Task 1: Itinerary CRUD Queries + Server Actions

**Files:**
- Create: `src/lib/db/queries/itinerary.ts`
- Create: `src/app/actions/itinerary.ts`

Itinerary queries: `getItineraryForTrip(tripId)`, `getItineraryForDay(tripId, date)`, `createItineraryItem(...)`, `updateItineraryItem(id, data)`, `deleteItineraryItem(id)`, `moveItineraryItem(id, newDate, newStartTime, newEndTime)`.

Server actions: `addItineraryItemAction`, `updateItineraryItemAction`, `deleteItineraryItemAction`, `moveItineraryItemAction` — all with auth + trip access checks.

Commit: `feat: add itinerary CRUD queries and server actions`

---

## Task 2: Preference Engine

**Files:**
- Create: `src/types/preferences.ts`
- Create: `src/app/actions/preferences.ts`
- Create: `src/components/trip/preference-panel.tsx`

Types for `TravelPreferences` interface (vibe, focus, diningStyle, pace, budget, walkingTolerance, transitPreference, indoorOutdoor). Server action to save preferences to trip's `preference_overrides` jsonb column. Client component with select dropdowns for each preference dimension.

Commit: `feat: add preference engine with trip-level overrides`

---

## Task 3: Daily Agenda View

**Files:**
- Create: `src/components/calendar/agenda-view.tsx`
- Create: `src/components/calendar/agenda-item.tsx`
- Create: `src/components/calendar/add-item-button.tsx`
- Modify: `src/app/(app)/trip/[tripId]/itinerary/page.tsx` — create itinerary page with view toggle

The agenda view shows one day at a time as a vertical timeline:
- Time markers on left rail
- Activity/meal/transit cards stacked chronologically
- Category color coding (amber=sightseeing, sage=food, teal=culture, violet=nightlife, gray=transit)
- Transit duration indicators between items
- "+" button in free time gaps
- Day selector at the top (prev/next day navigation)

Commit: `feat: add daily agenda view with timeline and activity cards`

---

## Task 4: Weekly Calendar with dnd-kit

**Files:**
- Create: `src/components/calendar/weekly-calendar.tsx`
- Create: `src/components/calendar/day-column.tsx`
- Create: `src/components/calendar/time-grid.tsx`
- Create: `src/components/calendar/activity-block.tsx`
- Create: `src/components/calendar/draggable-item.tsx`

Install: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

The weekly calendar is a 7-column grid:
- Time rows 6AM-11PM, 15-min increments
- Activity blocks positioned by start_time, height proportional to duration
- Color-coded by category
- Drag within day (reposition in time) and between days (change date)
- Snap to 15-minute grid
- Ghost preview during drag
- On drop: call moveItineraryItemAction

Commit: `feat: add weekly calendar with drag-and-drop via dnd-kit`

---

## Task 5: Mapbox Service + Transit Calculation

**Files:**
- Create: `src/lib/services/mapbox.ts`
- Create: `src/lib/utils/transit.ts`
- Create: `src/app/api/directions/route.ts`

Mapbox Directions API client for walking/driving transit time estimation. API route to proxy directions requests (keeps token server-side). Transit utility to compute travel time between two coordinates.

The transit recalculation flow:
1. After an itinerary item is moved/added
2. Server action fetches coordinates of adjacent items
3. Calls Mapbox Directions for walking time
4. Updates `transit_duration_min` on the moved item

Commit: `feat: add Mapbox directions service and transit calculation`

---

## Task 6: Recommendation Engine

**Files:**
- Create: `src/lib/ai/generate-recommendations.ts`
- Create: `src/lib/services/foursquare.ts`
- Create: `src/lib/db/queries/recommendations.ts`
- Create: `src/app/api/recommend/route.ts`
- Create: `src/app/actions/recommendations.ts`

Two-stage recommendation pipeline:
1. LLM Generation (Sonnet 4.5): takes destination, date, preferences, time gaps, weather context → generates 5-10 structured recommendations
2. Foursquare Enrichment: matches LLM suggestions against Foursquare Places API → adds ratings, hours, photos, precise coordinates

DB queries for recommendations CRUD. API route for generating recommendations. Server action for adding a recommendation to the itinerary.

Commit: `feat: add recommendation engine with LLM generation and Foursquare enrichment`

---

## Task 7: Recommendation UI + Add-to-Itinerary

**Files:**
- Create: `src/components/recommendations/recommendation-card.tsx`
- Create: `src/components/recommendations/recommendation-list.tsx`
- Create: `src/app/(app)/trip/[tripId]/recommendations/page.tsx`

Recommendation card showing: name, category icon, description, rationale, duration estimate, distance from anchor, rating/price level (from Foursquare), photo if available, "Add to itinerary" button, "Save for later" button.

Recommendations page with filter controls (category, walking distance) and a generate button. Uses the `/api/recommend` endpoint.

Commit: `feat: add recommendation cards with add-to-itinerary flow`

---

## Task 8: Map View with Mapbox GL

**Files:**
- Create: `src/components/map/trip-map.tsx`
- Create: `src/components/map/map-marker.tsx`
- Create: `src/components/map/map-popup.tsx`
- Create: `src/app/(app)/trip/[tripId]/map/page.tsx`

Install: `npm install mapbox-gl` and `npm install -D @types/mapbox-gl`

Map view with Mapbox GL JS dark style:
- Hotel marker (amber, prominent)
- Itinerary items as pins (color-coded by category)
- Recommendation markers (smaller, cluster when zoomed out)
- Click pin → popup with details
- "Add to Day X" action from popup
- Filter sidebar: category toggles

Commit: `feat: add map view with Mapbox GL dark mode and POI pins`
