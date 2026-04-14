import { db } from "@/lib/db";
import { itineraryItems } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function getItineraryForTrip(tripId: string) {
  return db.select().from(itineraryItems)
    .where(eq(itineraryItems.tripId, tripId))
    .orderBy(asc(itineraryItems.date), asc(itineraryItems.startTime), asc(itineraryItems.sortOrder));
}

export async function getItineraryForDay(tripId: string, date: string) {
  return db.select().from(itineraryItems)
    .where(and(eq(itineraryItems.tripId, tripId), eq(itineraryItems.date, date)))
    .orderBy(asc(itineraryItems.startTime), asc(itineraryItems.sortOrder));
}

export async function createItineraryItem(data: {
  tripId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "activity" | "meal" | "transit" | "free_time" | "custom";
  title: string;
  description?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  source?: "manual" | "recommendation" | "import";
  notes?: string;
}) {
  const [item] = await db.insert(itineraryItems).values({
    tripId: data.tripId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    type: data.type,
    title: data.title,
    description: data.description ?? null,
    locationName: data.locationName ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    category: data.category ?? null,
    source: data.source ?? "manual",
    notes: data.notes ?? null,
  }).returning();
  return item;
}

export async function updateItineraryItem(
  id: string,
  data: Partial<{
    date: string;
    startTime: string;
    endTime: string;
    title: string;
    description: string | null;
    locationName: string | null;
    latitude: number | null;
    longitude: number | null;
    category: string | null;
    notes: string | null;
    transitDurationMin: number | null;
  }>
) {
  const [item] = await db.update(itineraryItems).set(data).where(eq(itineraryItems.id, id)).returning();
  return item;
}

export async function deleteItineraryItem(id: string) {
  await db.delete(itineraryItems).where(eq(itineraryItems.id, id));
}

export async function moveItineraryItem(
  id: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string
) {
  const [item] = await db.update(itineraryItems).set({
    date: newDate,
    startTime: newStartTime,
    endTime: newEndTime,
  }).where(eq(itineraryItems.id, id)).returning();
  return item;
}
