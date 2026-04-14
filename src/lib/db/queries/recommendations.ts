import { db } from "@/lib/db";
import { recommendations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getRecommendationsForTrip(tripId: string) {
  return db.select().from(recommendations).where(eq(recommendations.tripId, tripId));
}

export async function getRecommendationsForDay(tripId: string, date: string) {
  return db.select().from(recommendations)
    .where(and(eq(recommendations.tripId, tripId), eq(recommendations.targetDate, date)));
}

export async function createRecommendations(
  tripId: string,
  date: string,
  items: {
    name: string; category: string; description: string; rationale: string;
    estimatedDurationMin: number; latitude?: number; longitude?: number;
    rating?: number; priceLevel?: number; foursquareId?: string; photoUrl?: string;
    distanceFromAnchor?: string;
  }[]
) {
  if (items.length === 0) return [];
  const values = items.map((item) => ({
    tripId, targetDate: date, name: item.name, category: item.category ?? null,
    description: item.description ?? null, rationale: item.rationale ?? null,
    estimatedDurationMin: item.estimatedDurationMin,
    distanceFromAnchor: item.distanceFromAnchor ?? null,
    latitude: item.latitude ?? null, longitude: item.longitude ?? null,
    rating: item.rating ?? null, priceLevel: item.priceLevel ?? null,
    foursquareId: item.foursquareId ?? null, photoUrl: item.photoUrl ?? null,
  }));
  return db.insert(recommendations).values(values).returning();
}

export async function updateRecommendationStatus(id: string, status: "suggested" | "saved" | "added" | "dismissed") {
  const [rec] = await db.update(recommendations).set({ status }).where(eq(recommendations.id, id)).returning();
  return rec;
}

export async function deleteRecommendationsForDay(tripId: string, date: string) {
  await db.delete(recommendations).where(and(eq(recommendations.tripId, tripId), eq(recommendations.targetDate, date)));
}
