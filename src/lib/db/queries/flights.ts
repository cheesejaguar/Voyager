import { db } from "@/lib/db";
import { flightSegments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function createFlightSegments(
  tripId: string,
  importDocumentId: string,
  segments: {
    airline: string; flightNumber: string; confirmationCode: string;
    passengerNames: string[]; departureAirport: string; arrivalAirport: string;
    departureTime: string; arrivalTime: string; terminal?: string; gate?: string;
    cabinClass?: string; seat?: string; direction: "outbound" | "return";
    sortOrder: number; connectionGroup: string;
  }[]
) {
  if (segments.length === 0) return [];
  const values = segments.map((s) => ({
    tripId, importDocumentId, airline: s.airline, flightNumber: s.flightNumber,
    confirmationCode: s.confirmationCode, passengerNames: s.passengerNames,
    departureAirport: s.departureAirport, arrivalAirport: s.arrivalAirport,
    departureTime: new Date(s.departureTime), arrivalTime: new Date(s.arrivalTime),
    terminal: s.terminal ?? null, gate: s.gate ?? null, cabinClass: s.cabinClass ?? null,
    seat: s.seat ?? null, direction: s.direction, sortOrder: s.sortOrder,
    connectionGroup: s.connectionGroup,
  }));
  return db.insert(flightSegments).values(values).returning();
}

export async function getFlightsForTrip(tripId: string) {
  return db.select().from(flightSegments).where(eq(flightSegments.tripId, tripId)).orderBy(flightSegments.sortOrder);
}

export async function checkDuplicateFlight(tripId: string, confirmationCode: string) {
  const results = await db.select().from(flightSegments)
    .where(and(eq(flightSegments.tripId, tripId), eq(flightSegments.confirmationCode, confirmationCode)))
    .limit(1);
  return results.length > 0;
}
