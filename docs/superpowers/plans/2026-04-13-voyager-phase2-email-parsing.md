# Voyager Phase 2: Email Parsing & Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core "magic moment" — paste a flight/hotel confirmation email, have AI extract structured booking data via streaming, review and confirm it, then auto-generate a trip itinerary scaffold.

**Architecture:** AI SDK v6 with Vercel AI Gateway for LLM access. `streamText` with `Output.object()` for streaming structured extraction. Haiku for classification, Sonnet for extraction. Server Actions for data persistence. React `useActionState` for form handling.

**Tech Stack:** AI SDK v6 (`ai` package), Zod schemas, Vercel AI Gateway, React Server Components + Client Components

**Spec:** `docs/superpowers/specs/2026-04-13-voyager-mvp-design.md` sections 4, 9.2, 9.3

---

## File Map

### AI Pipeline
- Create: `src/lib/ai/schemas.ts` — Zod schemas for email classification and extraction
- Create: `src/lib/ai/model-router.ts` — Model selection by task tier
- Create: `src/lib/ai/parse-email.ts` — Classification + extraction pipeline

### API Routes
- Create: `src/app/api/parse/route.ts` — Streaming email parse endpoint

### Database Queries
- Create: `src/lib/db/queries/flights.ts` — Flight segment CRUD
- Create: `src/lib/db/queries/hotels.ts` — Hotel stay CRUD
- Create: `src/lib/db/queries/imports.ts` — Import document CRUD
- Modify: `src/lib/db/queries/trips.ts` — Add updateTripDates

### Scaffold Logic
- Create: `src/lib/utils/scaffold.ts` — Trip scaffold generation from bookings

### UI Components
- Create: `src/components/trip/email-paste-panel.tsx` — Email paste textarea with streaming feedback
- Create: `src/components/trip/booking-review.tsx` — Review card for extracted booking data
- Create: `src/components/trip/flight-review-card.tsx` — Flight-specific review fields
- Create: `src/components/trip/hotel-review-card.tsx` — Hotel-specific review fields

### Server Actions
- Create: `src/app/actions/bookings.ts` — Confirm/reject booking, save to DB

### Pages
- Modify: `src/app/(app)/trip/[tripId]/overview/page.tsx` — Add import panel + timeline

### Tests
- Create: `tests/lib/ai/schemas.test.ts` — Schema validation tests
- Create: `tests/lib/utils/scaffold.test.ts` — Scaffold generation tests

---

## Task 1: Install AI SDK & Create Zod Schemas

**Files:**
- Create: `src/lib/ai/schemas.ts`
- Create: `tests/lib/ai/schemas.test.ts`

- [ ] **Step 1: Install AI SDK**

```bash
npm install ai
```

- [ ] **Step 2: Add AI_GATEWAY_API_KEY to .env.example**

Append to `.env.example`:
```
# Vercel AI Gateway
AI_GATEWAY_API_KEY=
```

- [ ] **Step 3: Write schema tests**

```typescript
// tests/lib/ai/schemas.test.ts
import { describe, it, expect } from "vitest";
import {
  emailClassificationSchema,
  flightExtractionSchema,
  hotelExtractionSchema,
} from "@/lib/ai/schemas";

describe("emailClassificationSchema", () => {
  it("validates a flight classification", () => {
    const result = emailClassificationSchema.safeParse({
      type: "flight",
      confidence: 0.95,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = emailClassificationSchema.safeParse({
      type: "car_rental",
      confidence: 0.9,
    });
    expect(result.success).toBe(false);
  });
});

describe("flightExtractionSchema", () => {
  it("validates a complete flight extraction", () => {
    const result = flightExtractionSchema.safeParse({
      airline: "United Airlines",
      flightNumber: "UA 1234",
      confirmationCode: "ABC123",
      passengerNames: ["John Doe"],
      segments: [
        {
          departureAirport: "SFO",
          arrivalAirport: "JFK",
          departureTime: "2025-06-01T10:00:00-07:00",
          arrivalTime: "2025-06-01T18:30:00-04:00",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("validates with optional fields", () => {
    const result = flightExtractionSchema.safeParse({
      airline: "Delta",
      flightNumber: "DL 500",
      confirmationCode: "XYZ789",
      passengerNames: ["Jane Smith"],
      segments: [
        {
          departureAirport: "LAX",
          arrivalAirport: "ATL",
          departureTime: "2025-07-15T08:00:00-07:00",
          arrivalTime: "2025-07-15T15:00:00-04:00",
          terminal: "T4",
          gate: "B12",
          cabinClass: "Economy",
          seat: "24A",
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("hotelExtractionSchema", () => {
  it("validates a complete hotel extraction", () => {
    const result = hotelExtractionSchema.safeParse({
      hotelName: "Grand Hotel Florence",
      address: "Via del Corso 1, Florence, Italy",
      confirmationNumber: "HTL-9876",
      checkIn: "2025-06-01T15:00:00+02:00",
      checkOut: "2025-06-05T11:00:00+02:00",
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npx vitest run tests/lib/ai/schemas.test.ts
```

- [ ] **Step 5: Create Zod schemas**

```typescript
// src/lib/ai/schemas.ts
import { z } from "zod";

export const emailClassificationSchema = z.object({
  type: z
    .enum(["flight", "hotel", "activity", "unknown"])
    .describe("The type of booking confirmation email"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score from 0.0 to 1.0"),
});

export type EmailClassification = z.infer<typeof emailClassificationSchema>;

export const flightSegmentSchema = z.object({
  departureAirport: z
    .string()
    .describe("IATA airport code for departure (e.g., SFO, JFK)"),
  arrivalAirport: z
    .string()
    .describe("IATA airport code for arrival (e.g., LAX, LHR)"),
  departureTime: z
    .string()
    .describe("Departure date/time in ISO 8601 format with timezone"),
  arrivalTime: z
    .string()
    .describe("Arrival date/time in ISO 8601 format with timezone"),
  terminal: z.string().optional().describe("Departure terminal if mentioned"),
  gate: z.string().optional().describe("Departure gate if mentioned"),
  cabinClass: z
    .string()
    .optional()
    .describe("Cabin class (Economy, Business, First)"),
  seat: z.string().optional().describe("Seat assignment if mentioned"),
});

export const flightExtractionSchema = z.object({
  airline: z.string().describe("Full airline name"),
  flightNumber: z.string().describe("Flight number including airline code"),
  confirmationCode: z
    .string()
    .describe("Booking confirmation or record locator code"),
  passengerNames: z
    .array(z.string())
    .describe("List of passenger names on the booking"),
  segments: z
    .array(flightSegmentSchema)
    .describe("Individual flight segments (legs) in order"),
});

export type FlightExtraction = z.infer<typeof flightExtractionSchema>;

export const hotelExtractionSchema = z.object({
  hotelName: z.string().describe("Full hotel or property name"),
  address: z.string().describe("Full address of the hotel"),
  confirmationNumber: z
    .string()
    .describe("Hotel booking confirmation number"),
  checkIn: z
    .string()
    .describe("Check-in date/time in ISO 8601 format with timezone"),
  checkOut: z
    .string()
    .describe("Check-out date/time in ISO 8601 format with timezone"),
  roomType: z.string().optional().describe("Room type if mentioned"),
  guestCount: z.number().optional().describe("Number of guests if mentioned"),
  contactInfo: z
    .string()
    .optional()
    .describe("Hotel contact info (phone/email) if mentioned"),
});

export type HotelExtraction = z.infer<typeof hotelExtractionSchema>;
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run tests/lib/ai/schemas.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai/schemas.ts tests/lib/ai/schemas.test.ts .env.example package.json package-lock.json
git commit -m "feat: add AI SDK and Zod schemas for email extraction"
```

---

## Task 2: Model Router & Parse Email Pipeline

**Files:**
- Create: `src/lib/ai/model-router.ts`
- Create: `src/lib/ai/parse-email.ts`

- [ ] **Step 1: Create model router**

```typescript
// src/lib/ai/model-router.ts

// Model IDs for Vercel AI Gateway
// Tier A: Fast/cheap for classification and simple tasks
// Tier B: Mid-tier for extraction and recommendations
// Tier C: Premium for narrative generation
export const models = {
  classify: "anthropic/claude-haiku-4.5",
  extract: "anthropic/claude-sonnet-4.5",
  extractFallback: "anthropic/claude-opus-4.5",
  recommend: "anthropic/claude-sonnet-4.5",
  recap: "anthropic/claude-sonnet-4.5",
  recapPremium: "anthropic/claude-opus-4.5",
  packingList: "anthropic/claude-haiku-4.5",
} as const;
```

- [ ] **Step 2: Create parse-email pipeline**

```typescript
// src/lib/ai/parse-email.ts
import { generateObject, streamText, Output } from "ai";
import { gateway } from "ai";
import { models } from "./model-router";
import {
  emailClassificationSchema,
  flightExtractionSchema,
  hotelExtractionSchema,
  type EmailClassification,
  type FlightExtraction,
  type HotelExtraction,
} from "./schemas";

export async function classifyEmail(
  emailText: string
): Promise<EmailClassification> {
  const { object } = await generateObject({
    model: gateway(models.classify),
    schema: emailClassificationSchema,
    prompt: `Classify the following email. Determine if it is a flight booking confirmation, hotel booking confirmation, activity/event booking, or unknown/unrelated content. Return the type and your confidence level.

Email:
${emailText}`,
  });

  return object;
}

export async function extractFlightDetails(emailText: string) {
  return streamText({
    model: gateway(models.extract),
    output: Output.object({ schema: flightExtractionSchema }),
    prompt: `Extract all flight booking details from this confirmation email. Be thorough — extract every segment if there are connections. Use ISO 8601 format with timezone for all dates/times. Use IATA airport codes.

Email:
${emailText}`,
  });
}

export async function extractHotelDetails(emailText: string) {
  return streamText({
    model: gateway(models.extract),
    output: Output.object({ schema: hotelExtractionSchema }),
    prompt: `Extract all hotel booking details from this confirmation email. Use ISO 8601 format with timezone for all dates/times. Include the full hotel address.

Email:
${emailText}`,
  });
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/
git commit -m "feat: add model router and email parse pipeline"
```

---

## Task 3: Streaming Parse API Route

**Files:**
- Create: `src/app/api/parse/route.ts`

- [ ] **Step 1: Create the parse API route**

```typescript
// src/app/api/parse/route.ts
import { auth } from "@clerk/nextjs/server";
import { classifyEmail, extractFlightDetails, extractHotelDetails } from "@/lib/ai/parse-email";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { emailText, tripId } = await req.json();

  if (!emailText || typeof emailText !== "string") {
    return Response.json({ error: "emailText is required" }, { status: 400 });
  }

  if (!tripId || typeof tripId !== "string") {
    return Response.json({ error: "tripId is required" }, { status: 400 });
  }

  // Step 1: Classify
  const classification = await classifyEmail(emailText);

  if (classification.type === "unknown") {
    return Response.json({
      classification,
      extraction: null,
      message: "Could not identify this as a booking confirmation.",
    });
  }

  // Step 2: Extract based on type
  if (classification.type === "flight") {
    const result = await extractFlightDetails(emailText);
    return result.toTextStreamResponse({
      headers: {
        "x-classification-type": "flight",
        "x-classification-confidence": String(classification.confidence),
        "x-trip-id": tripId,
      },
    });
  }

  if (classification.type === "hotel") {
    const result = await extractHotelDetails(emailText);
    return result.toTextStreamResponse({
      headers: {
        "x-classification-type": "hotel",
        "x-classification-confidence": String(classification.confidence),
        "x-trip-id": tripId,
      },
    });
  }

  // Activity type — not yet supported, return classification only
  return Response.json({
    classification,
    extraction: null,
    message: "Activity extraction is not yet supported.",
  });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/parse/
git commit -m "feat: add streaming email parse API route"
```

---

## Task 4: Database Queries for Bookings

**Files:**
- Create: `src/lib/db/queries/imports.ts`
- Create: `src/lib/db/queries/flights.ts`
- Create: `src/lib/db/queries/hotels.ts`
- Modify: `src/lib/db/queries/trips.ts`

- [ ] **Step 1: Create import document queries**

```typescript
// src/lib/db/queries/imports.ts
import { db } from "@/lib/db";
import { importDocuments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createImportDocument(data: {
  tripId: string;
  rawText: string;
  sourceType: "flight" | "hotel" | "activity" | "unknown";
  parsedJson: unknown;
  confidence: number;
}) {
  const [doc] = await db
    .insert(importDocuments)
    .values({
      tripId: data.tripId,
      rawText: data.rawText,
      sourceType: data.sourceType,
      parsedJson: data.parsedJson,
      confidence: data.confidence,
      status: "pending",
    })
    .returning();
  return doc;
}

export async function updateImportStatus(
  id: string,
  status: "reviewed" | "confirmed" | "rejected"
) {
  const [doc] = await db
    .update(importDocuments)
    .set({ status })
    .where(eq(importDocuments.id, id))
    .returning();
  return doc;
}

export async function getImportsForTrip(tripId: string) {
  return db
    .select()
    .from(importDocuments)
    .where(eq(importDocuments.tripId, tripId));
}
```

- [ ] **Step 2: Create flight segment queries**

```typescript
// src/lib/db/queries/flights.ts
import { db } from "@/lib/db";
import { flightSegments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function createFlightSegments(
  tripId: string,
  importDocumentId: string,
  segments: {
    airline: string;
    flightNumber: string;
    confirmationCode: string;
    passengerNames: string[];
    departureAirport: string;
    arrivalAirport: string;
    departureTime: string;
    arrivalTime: string;
    terminal?: string;
    gate?: string;
    cabinClass?: string;
    seat?: string;
    direction: "outbound" | "return";
    sortOrder: number;
    connectionGroup: string;
  }[]
) {
  if (segments.length === 0) return [];

  const values = segments.map((s) => ({
    tripId,
    importDocumentId,
    airline: s.airline,
    flightNumber: s.flightNumber,
    confirmationCode: s.confirmationCode,
    passengerNames: s.passengerNames,
    departureAirport: s.departureAirport,
    arrivalAirport: s.arrivalAirport,
    departureTime: new Date(s.departureTime),
    arrivalTime: new Date(s.arrivalTime),
    terminal: s.terminal ?? null,
    gate: s.gate ?? null,
    cabinClass: s.cabinClass ?? null,
    seat: s.seat ?? null,
    direction: s.direction,
    sortOrder: s.sortOrder,
    connectionGroup: s.connectionGroup,
  }));

  return db.insert(flightSegments).values(values).returning();
}

export async function getFlightsForTrip(tripId: string) {
  return db
    .select()
    .from(flightSegments)
    .where(eq(flightSegments.tripId, tripId))
    .orderBy(flightSegments.sortOrder);
}

export async function checkDuplicateFlight(
  tripId: string,
  confirmationCode: string
) {
  const results = await db
    .select()
    .from(flightSegments)
    .where(
      and(
        eq(flightSegments.tripId, tripId),
        eq(flightSegments.confirmationCode, confirmationCode)
      )
    )
    .limit(1);
  return results.length > 0;
}
```

- [ ] **Step 3: Create hotel stay queries**

```typescript
// src/lib/db/queries/hotels.ts
import { db } from "@/lib/db";
import { hotelStays } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function createHotelStay(
  tripId: string,
  importDocumentId: string,
  data: {
    hotelName: string;
    address: string;
    confirmationNumber: string;
    checkIn: string;
    checkOut: string;
    roomType?: string;
    guestCount?: number;
    contactInfo?: string;
  }
) {
  const [stay] = await db
    .insert(hotelStays)
    .values({
      tripId,
      importDocumentId,
      hotelName: data.hotelName,
      address: data.address,
      confirmationNumber: data.confirmationNumber,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      roomType: data.roomType ?? null,
      guestCount: data.guestCount ?? null,
      contactInfo: data.contactInfo ?? null,
    })
    .returning();
  return stay;
}

export async function getHotelsForTrip(tripId: string) {
  return db
    .select()
    .from(hotelStays)
    .where(eq(hotelStays.tripId, tripId));
}

export async function checkDuplicateHotel(
  tripId: string,
  confirmationNumber: string
) {
  const results = await db
    .select()
    .from(hotelStays)
    .where(
      and(
        eq(hotelStays.tripId, tripId),
        eq(hotelStays.confirmationNumber, confirmationNumber)
      )
    )
    .limit(1);
  return results.length > 0;
}
```

- [ ] **Step 4: Add updateTripDates to trips.ts**

Add this function to the existing `src/lib/db/queries/trips.ts`:

```typescript
export async function updateTripDates(
  tripId: string,
  startDate: string,
  endDate: string,
  destinations: string[]
) {
  const [updated] = await db
    .update(trips)
    .set({ startDate, endDate, destinations })
    .where(eq(trips.id, tripId))
    .returning();
  return updated;
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/queries/
git commit -m "feat: add booking CRUD queries (flights, hotels, imports)"
```

---

## Task 5: Scaffold Generation Logic (TDD)

**Files:**
- Create: `src/lib/utils/scaffold.ts`
- Create: `tests/lib/utils/scaffold.test.ts`

- [ ] **Step 1: Write scaffold tests**

```typescript
// tests/lib/utils/scaffold.test.ts
import { describe, it, expect } from "vitest";
import {
  computeTripDates,
  inferFlightDirection,
  computeDestinations,
} from "@/lib/utils/scaffold";

describe("computeTripDates", () => {
  it("computes dates from flights and hotels", () => {
    const flights = [
      { departureTime: new Date("2025-06-01T10:00:00Z"), arrivalTime: new Date("2025-06-01T18:00:00Z") },
      { departureTime: new Date("2025-06-08T16:00:00Z"), arrivalTime: new Date("2025-06-08T22:00:00Z") },
    ];
    const hotels = [
      { checkIn: new Date("2025-06-01T15:00:00Z"), checkOut: new Date("2025-06-08T11:00:00Z") },
    ];
    const { startDate, endDate } = computeTripDates(flights, hotels);
    expect(startDate).toBe("2025-06-01");
    expect(endDate).toBe("2025-06-08");
  });

  it("handles flights only", () => {
    const flights = [
      { departureTime: new Date("2025-06-01T10:00:00Z"), arrivalTime: new Date("2025-06-01T18:00:00Z") },
    ];
    const { startDate, endDate } = computeTripDates(flights, []);
    expect(startDate).toBe("2025-06-01");
    expect(endDate).toBe("2025-06-01");
  });

  it("handles hotels only", () => {
    const hotels = [
      { checkIn: new Date("2025-06-02T15:00:00Z"), checkOut: new Date("2025-06-05T11:00:00Z") },
    ];
    const { startDate, endDate } = computeTripDates([], hotels);
    expect(startDate).toBe("2025-06-02");
    expect(endDate).toBe("2025-06-05");
  });

  it("returns nulls when no bookings", () => {
    const { startDate, endDate } = computeTripDates([], []);
    expect(startDate).toBeNull();
    expect(endDate).toBeNull();
  });
});

describe("inferFlightDirection", () => {
  it("marks first half as outbound and second half as return", () => {
    const segments = [
      { departureTime: new Date("2025-06-01T10:00:00Z") },
      { departureTime: new Date("2025-06-01T14:00:00Z") },
      { departureTime: new Date("2025-06-08T16:00:00Z") },
      { departureTime: new Date("2025-06-08T20:00:00Z") },
    ];
    const directions = inferFlightDirection(segments);
    expect(directions).toEqual(["outbound", "outbound", "return", "return"]);
  });

  it("marks single segment as outbound", () => {
    const segments = [
      { departureTime: new Date("2025-06-01T10:00:00Z") },
    ];
    const directions = inferFlightDirection(segments);
    expect(directions).toEqual(["outbound"]);
  });

  it("marks odd number correctly (more outbound)", () => {
    const segments = [
      { departureTime: new Date("2025-06-01T10:00:00Z") },
      { departureTime: new Date("2025-06-04T10:00:00Z") },
      { departureTime: new Date("2025-06-08T16:00:00Z") },
    ];
    const directions = inferFlightDirection(segments);
    expect(directions).toEqual(["outbound", "outbound", "return"]);
  });
});

describe("computeDestinations", () => {
  it("extracts unique destination cities from flights", () => {
    const flights = [
      { departureAirport: "SFO", arrivalAirport: "FCO" },
      { departureAirport: "FCO", arrivalAirport: "SFO" },
    ];
    const destinations = computeDestinations(flights, "SFO");
    expect(destinations).toEqual(["FCO"]);
  });

  it("handles multi-city trips", () => {
    const flights = [
      { departureAirport: "SFO", arrivalAirport: "FCO" },
      { departureAirport: "FCO", arrivalAirport: "CDG" },
      { departureAirport: "CDG", arrivalAirport: "SFO" },
    ];
    const destinations = computeDestinations(flights, "SFO");
    expect(destinations).toEqual(["FCO", "CDG"]);
  });

  it("returns empty for no flights", () => {
    expect(computeDestinations([], "SFO")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/utils/scaffold.test.ts
```

- [ ] **Step 3: Implement scaffold functions**

```typescript
// src/lib/utils/scaffold.ts
import { format } from "date-fns";

interface FlightDates {
  departureTime: Date;
  arrivalTime: Date;
}

interface HotelDates {
  checkIn: Date;
  checkOut: Date;
}

export function computeTripDates(
  flights: FlightDates[],
  hotels: HotelDates[]
): { startDate: string | null; endDate: string | null } {
  const allDates: Date[] = [];

  for (const f of flights) {
    allDates.push(f.departureTime, f.arrivalTime);
  }
  for (const h of hotels) {
    allDates.push(h.checkIn, h.checkOut);
  }

  if (allDates.length === 0) {
    return { startDate: null, endDate: null };
  }

  const sorted = allDates.sort((a, b) => a.getTime() - b.getTime());
  return {
    startDate: format(sorted[0], "yyyy-MM-dd"),
    endDate: format(sorted[sorted.length - 1], "yyyy-MM-dd"),
  };
}

export function inferFlightDirection(
  segments: { departureTime: Date }[]
): ("outbound" | "return")[] {
  if (segments.length === 0) return [];

  const sorted = [...segments].sort(
    (a, b) => a.departureTime.getTime() - b.departureTime.getTime()
  );

  const midpoint = Math.ceil(sorted.length / 2);

  return sorted.map((_, i) => (i < midpoint ? "outbound" : "return"));
}

export function computeDestinations(
  flights: { departureAirport: string; arrivalAirport: string }[],
  homeAirport: string
): string[] {
  const seen = new Set<string>();
  const destinations: string[] = [];

  for (const f of flights) {
    for (const airport of [f.departureAirport, f.arrivalAirport]) {
      if (airport !== homeAirport && !seen.has(airport)) {
        seen.add(airport);
        destinations.push(airport);
      }
    }
  }

  return destinations;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/utils/scaffold.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/scaffold.ts tests/lib/utils/scaffold.test.ts
git commit -m "feat: add trip scaffold generation logic with tests"
```

---

## Task 6: Booking Confirmation Server Actions

**Files:**
- Create: `src/app/actions/bookings.ts`

- [ ] **Step 1: Create booking server actions**

```typescript
// src/app/actions/bookings.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById, updateTripDates } from "@/lib/db/queries/trips";
import { createImportDocument, updateImportStatus } from "@/lib/db/queries/imports";
import {
  createFlightSegments,
  checkDuplicateFlight,
  getFlightsForTrip,
} from "@/lib/db/queries/flights";
import {
  createHotelStay,
  checkDuplicateHotel,
  getHotelsForTrip,
} from "@/lib/db/queries/hotels";
import { computeTripDates, inferFlightDirection, computeDestinations } from "@/lib/utils/scaffold";
import type { FlightExtraction, HotelExtraction } from "@/lib/ai/schemas";

export async function confirmFlightBooking(
  tripId: string,
  emailText: string,
  extraction: FlightExtraction,
  confidence: number
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");

  // Check for duplicate
  const isDuplicate = await checkDuplicateFlight(
    tripId,
    extraction.confirmationCode
  );
  if (isDuplicate) {
    return { success: false, error: "This flight has already been added." };
  }

  // Save import document
  const importDoc = await createImportDocument({
    tripId,
    rawText: emailText,
    sourceType: "flight",
    parsedJson: extraction,
    confidence,
  });

  // Infer directions
  const directions = inferFlightDirection(
    extraction.segments.map((s) => ({
      departureTime: new Date(s.departureTime),
    }))
  );

  // Create flight segments
  const connectionGroup = `flight-${importDoc.id}`;
  await createFlightSegments(
    tripId,
    importDoc.id,
    extraction.segments.map((s, i) => ({
      airline: extraction.airline,
      flightNumber: extraction.flightNumber,
      confirmationCode: extraction.confirmationCode,
      passengerNames: extraction.passengerNames,
      departureAirport: s.departureAirport,
      arrivalAirport: s.arrivalAirport,
      departureTime: s.departureTime,
      arrivalTime: s.arrivalTime,
      terminal: s.terminal,
      gate: s.gate,
      cabinClass: s.cabinClass,
      seat: s.seat,
      direction: directions[i],
      sortOrder: i,
      connectionGroup,
    }))
  );

  // Update import status
  await updateImportStatus(importDoc.id, "confirmed");

  // Update trip dates and destinations
  await updateTripScaffold(tripId);

  revalidatePath(`/trip/${tripId}`);
  return { success: true };
}

export async function confirmHotelBooking(
  tripId: string,
  emailText: string,
  extraction: HotelExtraction,
  confidence: number
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");

  // Check for duplicate
  const isDuplicate = await checkDuplicateHotel(
    tripId,
    extraction.confirmationNumber
  );
  if (isDuplicate) {
    return { success: false, error: "This hotel has already been added." };
  }

  // Save import document
  const importDoc = await createImportDocument({
    tripId,
    rawText: emailText,
    sourceType: "hotel",
    parsedJson: extraction,
    confidence,
  });

  // Create hotel stay
  await createHotelStay(tripId, importDoc.id, extraction);

  // Update import status
  await updateImportStatus(importDoc.id, "confirmed");

  // Update trip dates
  await updateTripScaffold(tripId);

  revalidatePath(`/trip/${tripId}`);
  return { success: true };
}

async function updateTripScaffold(tripId: string) {
  const flights = await getFlightsForTrip(tripId);
  const hotels = await getHotelsForTrip(tripId);

  const flightDates = flights
    .filter((f) => f.departureTime && f.arrivalTime)
    .map((f) => ({
      departureTime: f.departureTime!,
      arrivalTime: f.arrivalTime!,
    }));

  const hotelDates = hotels
    .filter((h) => h.checkIn && h.checkOut)
    .map((h) => ({
      checkIn: h.checkIn!,
      checkOut: h.checkOut!,
    }));

  const { startDate, endDate } = computeTripDates(flightDates, hotelDates);

  if (startDate && endDate) {
    const flightAirports = flights
      .filter((f) => f.departureAirport && f.arrivalAirport)
      .map((f) => ({
        departureAirport: f.departureAirport!,
        arrivalAirport: f.arrivalAirport!,
      }));

    // Use the first departure airport as home
    const homeAirport = flights[0]?.departureAirport ?? "";
    const destinations = computeDestinations(flightAirports, homeAirport);

    await updateTripDates(tripId, startDate, endDate, destinations);
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/bookings.ts
git commit -m "feat: add booking confirmation server actions with scaffold update"
```

---

## Task 7: Email Paste Panel UI

**Files:**
- Create: `src/components/trip/email-paste-panel.tsx`
- Create: `src/components/trip/booking-review.tsx`
- Create: `src/components/trip/flight-review-card.tsx`
- Create: `src/components/trip/hotel-review-card.tsx`
- Modify: `src/app/(app)/trip/[tripId]/overview/page.tsx`

- [ ] **Step 1: Create flight review card**

```tsx
// src/components/trip/flight-review-card.tsx
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane } from "lucide-react";
import type { FlightExtraction } from "@/lib/ai/schemas";

interface FlightReviewCardProps {
  data: FlightExtraction;
}

export function FlightReviewCard({ data }: FlightReviewCardProps) {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <Plane className="h-4 w-4 text-accent" />
        Flight: {data.airline} {data.flightNumber}
      </CardTitle>
      <CardContent className="mt-3 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="accent">Confirmation: {data.confirmationCode}</Badge>
        </div>
        <div className="text-sm text-text-secondary">
          Passengers: {data.passengerNames.join(", ")}
        </div>
        <div className="space-y-2">
          {data.segments.map((seg, i) => (
            <div
              key={i}
              className="rounded-lg bg-surface p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {seg.departureAirport} → {seg.arrivalAirport}
                </span>
                {seg.cabinClass && (
                  <Badge variant="default">{seg.cabinClass}</Badge>
                )}
              </div>
              <div className="mt-1 text-text-muted">
                {new Date(seg.departureTime).toLocaleString()} →{" "}
                {new Date(seg.arrivalTime).toLocaleString()}
              </div>
              {(seg.terminal || seg.gate || seg.seat) && (
                <div className="mt-1 text-text-muted text-xs">
                  {seg.terminal && `Terminal ${seg.terminal}`}
                  {seg.gate && ` / Gate ${seg.gate}`}
                  {seg.seat && ` / Seat ${seg.seat}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create hotel review card**

```tsx
// src/components/trip/hotel-review-card.tsx
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import type { HotelExtraction } from "@/lib/ai/schemas";

interface HotelReviewCardProps {
  data: HotelExtraction;
}

export function HotelReviewCard({ data }: HotelReviewCardProps) {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-accent" />
        Hotel: {data.hotelName}
      </CardTitle>
      <CardContent className="mt-3 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="accent">
            Confirmation: {data.confirmationNumber}
          </Badge>
        </div>
        <div className="rounded-lg bg-surface p-3 text-sm space-y-1">
          <div className="text-text-secondary">{data.address}</div>
          <div className="text-text-muted">
            Check-in: {new Date(data.checkIn).toLocaleString()}
          </div>
          <div className="text-text-muted">
            Check-out: {new Date(data.checkOut).toLocaleString()}
          </div>
          {data.roomType && (
            <div className="text-text-muted">Room: {data.roomType}</div>
          )}
          {data.guestCount && (
            <div className="text-text-muted">
              Guests: {data.guestCount}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create booking review wrapper**

```tsx
// src/components/trip/booking-review.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlightReviewCard } from "./flight-review-card";
import { HotelReviewCard } from "./hotel-review-card";
import { confirmFlightBooking, confirmHotelBooking } from "@/app/actions/bookings";
import type { FlightExtraction, HotelExtraction } from "@/lib/ai/schemas";

interface BookingReviewProps {
  tripId: string;
  emailText: string;
  type: "flight" | "hotel";
  data: FlightExtraction | HotelExtraction;
  confidence: number;
  onConfirmed: () => void;
  onDismiss: () => void;
}

export function BookingReview({
  tripId,
  emailText,
  type,
  data,
  confidence,
  onConfirmed,
  onDismiss,
}: BookingReviewProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);

    try {
      let result;
      if (type === "flight") {
        result = await confirmFlightBooking(
          tripId,
          emailText,
          data as FlightExtraction,
          confidence
        );
      } else {
        result = await confirmHotelBooking(
          tripId,
          emailText,
          data as HotelExtraction,
          confidence
        );
      }

      if (result.success) {
        onConfirmed();
      } else {
        setError(result.error ?? "Failed to save booking.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {type === "flight" ? (
        <FlightReviewCard data={data as FlightExtraction} />
      ) : (
        <HotelReviewCard data={data as HotelExtraction} />
      )}

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleConfirm} disabled={pending}>
          {pending ? "Saving..." : "Confirm & Add"}
        </Button>
        <Button variant="ghost" onClick={onDismiss} disabled={pending}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create email paste panel**

```tsx
// src/components/trip/email-paste-panel.tsx
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { BookingReview } from "./booking-review";
import { Mail, Loader2 } from "lucide-react";
import type { FlightExtraction, HotelExtraction } from "@/lib/ai/schemas";

type ParseState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "classified"; type: string }
  | {
      status: "extracted";
      type: "flight" | "hotel";
      data: FlightExtraction | HotelExtraction;
      confidence: number;
    }
  | { status: "error"; message: string }
  | { status: "confirmed" };

interface EmailPastePanelProps {
  tripId: string;
}

export function EmailPastePanel({ tripId }: EmailPastePanelProps) {
  const [emailText, setEmailText] = useState("");
  const [state, setState] = useState<ParseState>({ status: "idle" });

  const handleParse = useCallback(async () => {
    if (!emailText.trim()) return;

    setState({ status: "parsing" });

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText, tripId }),
      });

      if (!response.ok) {
        const err = await response.json();
        setState({ status: "error", message: err.error || "Parse failed" });
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";

      // Check if streaming response (text/plain from AI SDK)
      if (contentType.includes("text/plain") || contentType.includes("text/event-stream")) {
        const classificationType = response.headers.get("x-classification-type") as "flight" | "hotel";
        const confidence = parseFloat(
          response.headers.get("x-classification-confidence") ?? "0.8"
        );

        setState({ status: "classified", type: classificationType });

        // Read the full stream to get the complete object
        const text = await response.text();

        // Parse the accumulated text - AI SDK streams text that builds up the JSON
        // The final text contains the complete JSON object
        try {
          // Try to find a complete JSON object in the stream output
          const lines = text.split("\n").filter((l) => l.trim());
          let parsed: FlightExtraction | HotelExtraction | null = null;

          // AI SDK streamText with Output.object streams partial objects
          // We need to find the final complete one
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              parsed = JSON.parse(lines[i]);
              break;
            } catch {
              continue;
            }
          }

          if (!parsed) {
            // Try parsing the entire text as JSON
            parsed = JSON.parse(text);
          }

          setState({
            status: "extracted",
            type: classificationType,
            data: parsed!,
            confidence,
          });
        } catch {
          setState({
            status: "error",
            message: "Failed to parse extraction results. Please try again.",
          });
        }
      } else {
        // JSON response (unknown type or error)
        const json = await response.json();
        if (json.classification?.type === "unknown") {
          setState({
            status: "error",
            message: "This doesn't appear to be a booking confirmation email.",
          });
        } else {
          setState({
            status: "error",
            message: json.message || "Unsupported email type.",
          });
        }
      }
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }, [emailText, tripId]);

  function handleReset() {
    setEmailText("");
    setState({ status: "idle" });
  }

  if (state.status === "extracted") {
    return (
      <BookingReview
        tripId={tripId}
        emailText={emailText}
        type={state.type}
        data={state.data}
        confidence={state.confidence}
        onConfirmed={() => {
          setState({ status: "confirmed" });
          setTimeout(handleReset, 2000);
        }}
        onDismiss={handleReset}
      />
    );
  }

  if (state.status === "confirmed") {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-success font-medium">Booking added successfully!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-accent" />
        Import Booking
      </CardTitle>
      <CardContent className="mt-3">
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder="Paste your flight or hotel confirmation email here..."
          className="w-full h-40 rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
          disabled={state.status === "parsing" || state.status === "classified"}
        />

        {state.status === "error" && (
          <p className="mt-2 text-sm text-error">{state.message}</p>
        )}

        {(state.status === "parsing" || state.status === "classified") && (
          <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
            <Loader2 className="h-4 w-4 animate-spin" />
            {state.status === "parsing"
              ? "Classifying email..."
              : `Extracting ${state.type} details...`}
          </div>
        )}

        <div className="mt-3 flex gap-3">
          <Button
            onClick={handleParse}
            disabled={
              !emailText.trim() ||
              state.status === "parsing" ||
              state.status === "classified"
            }
          >
            {state.status === "parsing" || state.status === "classified"
              ? "Processing..."
              : "Extract Booking"}
          </Button>
          {state.status === "error" && (
            <Button variant="ghost" onClick={handleReset}>
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Update trip overview page to include the import panel**

Add the EmailPastePanel to the trip overview page. Modify `src/app/(app)/trip/[tripId]/overview/page.tsx`:

After the existing flights/hotels cards grid, add:
```tsx
import { EmailPastePanel } from "@/components/trip/email-paste-panel";

// ... existing code ...

// After the </div> that closes the grid of cards, add:
<div className="mt-8">
  <EmailPastePanel tripId={tripId} />
</div>
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/trip/ src/app/\(app\)/trip/
git commit -m "feat: add email paste panel with booking review cards"
```

---

## Verification

After all tasks are complete:

1. `npm run build` — should pass
2. `npm test` — all tests should pass (8 phase tests + 5 schema tests + 7 scaffold tests = 20 tests)
3. Manual test (requires AI_GATEWAY_API_KEY in .env.local):
   - Go to a trip overview page
   - Paste a flight confirmation email
   - See classification → extraction → review card flow
   - Confirm booking → see it appear in the flights card
   - Paste a hotel confirmation email
   - See similar flow → confirm → appears in hotels card
