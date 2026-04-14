# Voyager Phase 3: Pre-Trip & Flights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the pre-trip dashboard (countdown, weather, packing list, checklist, reservation summary) and flight phase dashboards (outbound + return with segment timelines and connection warnings).

**Architecture:** Server Components for data fetching, Client Components for interactive checklists. Open-Meteo for weather (free, no API key). AI SDK with Haiku for packing/task generation. Streaming server actions for AI-generated content.

**Tech Stack:** Next.js 16 App Router, Open-Meteo API, AI SDK v6 + AI Gateway (Haiku 4.5), date-fns

**Spec:** `docs/superpowers/specs/2026-04-13-voyager-mvp-design.md` sections 8, 9

---

## Task 1: Weather Service Client

**Files:**
- Create: `src/lib/services/weather.ts`

```typescript
// src/lib/services/weather.ts
import { format, addDays, differenceInDays } from "date-fns";

export interface DailyForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
  weatherCode: number;
}

export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle",
    55: "Dense drizzle", 61: "Slight rain", 63: "Rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Slight showers", 81: "Showers", 82: "Violent showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm",
  };
  return descriptions[code] ?? "Unknown";
}

export function getWeatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 65) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    start_date: startDate,
    end_date: endDate,
    timezone: "auto",
    temperature_unit: "fahrenheit",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { next: { revalidate: 86400 } } // Cache for 24 hours
  );

  if (!response.ok) return [];

  const data = await response.json();
  const daily = data.daily;
  if (!daily?.time) return [];

  return daily.time.map((date: string, i: number) => ({
    date,
    temperatureMax: Math.round(daily.temperature_2m_max[i]),
    temperatureMin: Math.round(daily.temperature_2m_min[i]),
    precipitationProbability: daily.precipitation_probability_max[i] ?? 0,
    weatherCode: daily.weather_code[i] ?? 0,
  }));
}
```

Commit: `feat: add Open-Meteo weather service client`

---

## Task 2: AI Packing List & Task Generation

**Files:**
- Create: `src/lib/ai/generate-packing-list.ts`
- Create: `src/lib/ai/generate-pre-trip-tasks.ts`
- Create: `src/lib/db/queries/packing.ts`
- Create: `src/lib/db/queries/pre-trip-tasks.ts`

**Packing list generation:**
```typescript
// src/lib/ai/generate-packing-list.ts
import { generateText, Output } from "ai";
import { gateway } from "ai";
import { z } from "zod";
import { models } from "./model-router";

const packingListSchema = z.object({
  items: z.array(z.object({
    text: z.string().describe("Item to pack"),
    category: z.enum(["clothing", "tech", "toiletries", "documents", "accessories", "misc"])
      .describe("Packing category"),
  })),
});

export async function generatePackingList(context: {
  destinations: string[];
  durationDays: number;
  weather: { avgHigh: number; avgLow: number; rainyDays: number };
}) {
  const { output } = await generateText({
    model: gateway(models.packingList),
    output: Output.object({ schema: packingListSchema }),
    prompt: `Generate a practical packing list for a ${context.durationDays}-day trip to ${context.destinations.join(", ")}.

Weather: Average high ${context.weather.avgHigh}°F, low ${context.weather.avgLow}°F, ${context.weather.rainyDays} rainy days expected.

Include essentials for clothing, tech (chargers, adapters), toiletries, documents (passport, copies), and accessories. Be practical, not excessive. Aim for 20-35 items total.`,
  });

  return output?.items ?? [];
}
```

**Pre-trip task generation:**
```typescript
// src/lib/ai/generate-pre-trip-tasks.ts
import { generateText, Output } from "ai";
import { gateway } from "ai";
import { z } from "zod";
import { models } from "./model-router";

const preTripTasksSchema = z.object({
  tasks: z.array(z.object({
    text: z.string().describe("Task description"),
    dueDescription: z.string().describe("When to do this relative to departure, e.g. '24 hours before departure'"),
  })),
});

export async function generatePreTripTasks(context: {
  destinations: string[];
  departureDate: string;
  hasInternationalFlight: boolean;
}) {
  const { output } = await generateText({
    model: gateway(models.packingList),
    output: Output.object({ schema: preTripTasksSchema }),
    prompt: `Generate a pre-trip preparation checklist for a trip to ${context.destinations.join(", ")} departing ${context.departureDate}.
${context.hasInternationalFlight ? "This is an international trip." : "This is a domestic trip."}

Include practical tasks like: flight check-in, passport verification, visa requirements, downloading offline maps, packing chargers/adapters, confirming reservations, arranging ground transportation. Prioritize by urgency. Aim for 8-12 tasks.`,
  });

  return output?.tasks ?? [];
}
```

**Packing queries:**
```typescript
// src/lib/db/queries/packing.ts
import { db } from "@/lib/db";
import { packingItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getPackingItems(tripId: string) {
  return db.select().from(packingItems).where(eq(packingItems.tripId, tripId)).orderBy(packingItems.sortOrder);
}

export async function createPackingItems(tripId: string, items: { text: string; category: string }[]) {
  if (items.length === 0) return [];
  const values = items.map((item, i) => ({
    tripId, text: item.text, category: item.category, sortOrder: i,
  }));
  return db.insert(packingItems).values(values).returning();
}

export async function togglePackingItem(id: string, checked: boolean) {
  const [item] = await db.update(packingItems).set({ checked }).where(eq(packingItems.id, id)).returning();
  return item;
}

export async function deletePackingItem(id: string) {
  await db.delete(packingItems).where(eq(packingItems.id, id));
}

export async function deleteAllPackingItems(tripId: string) {
  await db.delete(packingItems).where(eq(packingItems.tripId, tripId));
}
```

**Pre-trip task queries:**
```typescript
// src/lib/db/queries/pre-trip-tasks.ts
import { db } from "@/lib/db";
import { preTripTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getPreTripTasks(tripId: string) {
  return db.select().from(preTripTasks).where(eq(preTripTasks.tripId, tripId)).orderBy(preTripTasks.sortOrder);
}

export async function createPreTripTasks(tripId: string, tasks: { text: string; dueDescription: string }[]) {
  if (tasks.length === 0) return [];
  const values = tasks.map((task, i) => ({
    tripId, text: task.text, dueDescription: task.dueDescription, sortOrder: i,
  }));
  return db.insert(preTripTasks).values(values).returning();
}

export async function togglePreTripTask(id: string, completed: boolean) {
  const [task] = await db.update(preTripTasks).set({ completed }).where(eq(preTripTasks.id, id)).returning();
  return task;
}

export async function deletePreTripTask(id: string) {
  await db.delete(preTripTasks).where(eq(preTripTasks.id, id));
}

export async function deleteAllPreTripTasks(tripId: string) {
  await db.delete(preTripTasks).where(eq(preTripTasks.tripId, tripId));
}
```

Commit: `feat: add AI packing list and pre-trip task generation with DB queries`

---

## Task 3: Pre-Trip Server Actions

**Files:**
- Create: `src/app/actions/pre-trip.ts`

```typescript
// src/app/actions/pre-trip.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { getPackingItems, createPackingItems, togglePackingItem, deleteAllPackingItems } from "@/lib/db/queries/packing";
import { getPreTripTasks, createPreTripTasks, togglePreTripTask, deleteAllPreTripTasks } from "@/lib/db/queries/pre-trip-tasks";
import { generatePackingList } from "@/lib/ai/generate-packing-list";
import { generatePreTripTasks } from "@/lib/ai/generate-pre-trip-tasks";
import { getWeatherForecast } from "@/lib/services/weather";
import { differenceInDays } from "date-fns";

async function requireTripAccess(tripId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");
  return { user, trip };
}

export async function generatePackingListAction(tripId: string) {
  const { trip } = await requireTripAccess(tripId);
  const tripData = await getTripWithFlights(tripId);
  if (!trip.startDate || !trip.endDate) throw new Error("Trip dates not set");

  const durationDays = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;
  const destinations = trip.destinations ?? [];

  // Simple weather summary — use first destination coordinates if available
  // For MVP, use rough defaults since we may not have coordinates
  const weather = { avgHigh: 75, avgLow: 55, rainyDays: 2 };

  const items = await generatePackingList({ destinations, durationDays, weather });

  // Clear existing and insert new
  await deleteAllPackingItems(tripId);
  await createPackingItems(tripId, items);

  revalidatePath(`/trip/${tripId}/pre-trip`);
  return { success: true };
}

export async function togglePackingItemAction(itemId: string, checked: boolean, tripId: string) {
  await requireTripAccess(tripId);
  await togglePackingItem(itemId, checked);
  revalidatePath(`/trip/${tripId}/pre-trip`);
}

export async function generatePreTripTasksAction(tripId: string) {
  const { trip } = await requireTripAccess(tripId);
  const tripData = await getTripWithFlights(tripId);
  if (!trip.startDate) throw new Error("Trip dates not set");

  const destinations = trip.destinations ?? [];
  const flights = tripData?.flights ?? [];
  const hasInternationalFlight = flights.some(
    (f) => f.departureAirport && f.arrivalAirport &&
      f.departureAirport.length === 3 && f.arrivalAirport.length === 3
  );

  const tasks = await generatePreTripTasks({
    destinations,
    departureDate: trip.startDate,
    hasInternationalFlight,
  });

  await deleteAllPreTripTasks(tripId);
  await createPreTripTasks(tripId, tasks);

  revalidatePath(`/trip/${tripId}/pre-trip`);
  return { success: true };
}

export async function togglePreTripTaskAction(taskId: string, completed: boolean, tripId: string) {
  await requireTripAccess(tripId);
  await togglePreTripTask(taskId, completed);
  revalidatePath(`/trip/${tripId}/pre-trip`);
}
```

Commit: `feat: add pre-trip server actions for packing list and task generation`

---

## Task 4: Pre-Trip Dashboard Page & Components

**Files:**
- Create: `src/components/trip/countdown.tsx`
- Create: `src/components/trip/weather-preview.tsx`
- Create: `src/components/trip/packing-list.tsx`
- Create: `src/components/trip/checklist.tsx`
- Create: `src/app/(app)/trip/[tripId]/pre-trip/page.tsx`

These are the UI components for the pre-trip dashboard. The countdown shows days/hours until departure. Weather preview shows forecast cards. Packing list and checklist are interactive with check/uncheck and generate buttons.

Key implementation notes:
- `countdown.tsx` — Client component, computes days/hours from departure date, updates every minute
- `weather-preview.tsx` — Server component fetching from Open-Meteo, shows temp + conditions per day
- `packing-list.tsx` — Client component with checkboxes, calls togglePackingItemAction. Has "Generate" button that calls generatePackingListAction
- `checklist.tsx` — Reusable checked/unchecked list component used by both packing and pre-trip tasks
- `pre-trip/page.tsx` — Server component composing all modules: countdown, weather, packing, tasks, reservation summary

The page should show a grid layout with:
- Top: Countdown + Weather row
- Middle: Packing List (left) + Pre-Trip Tasks (right)
- Bottom: Reservation summary (flights + hotels compact cards)

Commit: `feat: add pre-trip dashboard with countdown, weather, packing, and tasks`

---

## Task 5: Flight Phase Dashboard

**Files:**
- Create: `src/components/trip/flight-card.tsx`
- Create: `src/components/trip/segment-timeline.tsx`
- Create: `src/app/(app)/trip/[tripId]/flight/[direction]/page.tsx`

The flight dashboard shows:
- Flight cards with airline, number, route, times, terminal/gate
- Horizontal segment timeline showing each leg with connection durations
- Connection warnings: red badge if < 60 min domestic / < 90 min international
- Layover info for connections > 3 hours
- For return flights: "Leave by" calculator (hotel checkout - transit buffer - airport buffer)

Key implementation notes:
- `flight-card.tsx` — Displays one flight segment with all details
- `segment-timeline.tsx` — Horizontal visual timeline of all segments in a connection group, showing durations and connection times between them
- `flight/[direction]/page.tsx` — Server component that fetches flights filtered by direction (outbound/return), groups by connection_group, renders cards + timeline. For return direction, adds leave-by calculator using hotel checkout time

Connection time calculation:
```typescript
const connectionMinutes = differenceInMinutes(nextSegment.departureTime, currentSegment.arrivalTime);
const isTight = connectionMinutes < 90; // simplified: treat all as international for MVP
```

Leave-by calculation (return flight only):
```typescript
const bufferHours = 3; // international buffer
const leaveByTime = subHours(firstReturnFlight.departureTime, bufferHours);
```

Commit: `feat: add flight phase dashboard with segment timeline and connection warnings`

---

## Verification

1. `npm run build` — should pass
2. `npm test` — all 23 tests should pass
3. Manual verification (requires DB + Clerk + AI Gateway):
   - Create trip, add flights + hotel via email paste
   - Navigate to Pre-Trip: see countdown, weather stub, empty packing/task lists
   - Click "Generate Packing List" — AI generates items, checkboxes work
   - Click "Generate Tasks" — AI generates checklist, checkboxes work
   - Navigate to Outbound Flight — see flight cards, segment timeline
   - Navigate to Return Flight — see return flights + leave-by calculator
