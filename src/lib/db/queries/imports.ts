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
  const [doc] = await db.insert(importDocuments).values({
    tripId: data.tripId, rawText: data.rawText, sourceType: data.sourceType,
    parsedJson: data.parsedJson, confidence: data.confidence, status: "pending",
  }).returning();
  return doc;
}

export async function updateImportStatus(id: string, status: "reviewed" | "confirmed" | "rejected") {
  const [doc] = await db.update(importDocuments).set({ status }).where(eq(importDocuments.id, id)).returning();
  return doc;
}

export async function getImportsForTrip(tripId: string) {
  return db.select().from(importDocuments).where(eq(importDocuments.tripId, tripId));
}
