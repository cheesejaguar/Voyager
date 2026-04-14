import { db } from "@/lib/db";
import { trips, tripMembers, flightSegments, hotelStays } from "@/lib/db/schema";
import { eq, and, desc, isNotNull } from "drizzle-orm";

export async function getTripsForUser(userId: string) {
  const results = await db
    .select({ trip: trips, role: tripMembers.role })
    .from(tripMembers)
    .innerJoin(trips, eq(tripMembers.tripId, trips.id))
    .where(and(eq(tripMembers.userId, userId), isNotNull(tripMembers.joinedAt)))
    .orderBy(desc(trips.updatedAt));
  return results.map((r) => ({ ...r.trip, memberRole: r.role }));
}

export async function getTripById(tripId: string, userId: string) {
  const result = await db
    .select({ trip: trips, role: tripMembers.role })
    .from(tripMembers)
    .innerJoin(trips, eq(tripMembers.tripId, trips.id))
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId), isNotNull(tripMembers.joinedAt)))
    .limit(1);
  if (!result[0]) return null;
  return { ...result[0].trip, memberRole: result[0].role };
}

export async function getTripWithFlights(tripId: string) {
  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
  if (!trip) return null;
  const flights = await db.select().from(flightSegments).where(eq(flightSegments.tripId, tripId)).orderBy(flightSegments.sortOrder);
  const hotels = await db.select().from(hotelStays).where(eq(hotelStays.tripId, tripId));
  return { ...trip, flights, hotels };
}

export async function createTrip(title: string, userId: string): Promise<string> {
  const [trip] = await db.insert(trips).values({ title }).returning();
  await db.insert(tripMembers).values({
    tripId: trip.id,
    userId,
    role: "owner",
    joinedAt: new Date(),
  });
  return trip.id;
}

export async function updateTrip(tripId: string, data: { title?: string; status?: "planning" | "active" | "completed" | "archived" }) {
  const [updated] = await db.update(trips).set(data).where(eq(trips.id, tripId)).returning();
  return updated;
}

export async function deleteTrip(tripId: string) {
  await db.delete(trips).where(eq(trips.id, tripId));
}

export async function isUserTripOwner(tripId: string, userId: string): Promise<boolean> {
  const result = await db.select().from(tripMembers).where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId), eq(tripMembers.role, "owner"))).limit(1);
  return result.length > 0;
}

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
