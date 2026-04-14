import { db } from "@/lib/db";
import { tripSummaries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getTripSummaries(tripId: string) {
  return db.select().from(tripSummaries).where(eq(tripSummaries.tripId, tripId));
}

export async function getTripSummaryByStyle(tripId: string, style: "concise" | "narrative" | "scrapbook") {
  const [summary] = await db.select().from(tripSummaries)
    .where(and(eq(tripSummaries.tripId, tripId), eq(tripSummaries.style, style)))
    .limit(1);
  return summary ?? null;
}

export async function upsertTripSummary(tripId: string, style: "concise" | "narrative" | "scrapbook", content: string) {
  const existing = await getTripSummaryByStyle(tripId, style);
  if (existing) {
    const [updated] = await db.update(tripSummaries).set({ content }).where(eq(tripSummaries.id, existing.id)).returning();
    return updated;
  }
  const [created] = await db.insert(tripSummaries).values({ tripId, style, content }).returning();
  return created;
}
