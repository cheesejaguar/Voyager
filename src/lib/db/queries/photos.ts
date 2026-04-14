import { db } from "@/lib/db";
import { photoAssets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getPhotosForTrip(tripId: string) {
  return db.select().from(photoAssets).where(eq(photoAssets.tripId, tripId)).orderBy(photoAssets.createdAt);
}

export async function createPhotoAsset(data: {
  tripId: string;
  blobUrl: string;
  filename: string;
  takenAt?: Date;
  gpsLatitude?: number;
  gpsLongitude?: number;
  associatedDate?: string;
  associatedItineraryItemId?: string;
}) {
  const [photo] = await db.insert(photoAssets).values({
    tripId: data.tripId,
    blobUrl: data.blobUrl,
    filename: data.filename,
    takenAt: data.takenAt ?? null,
    gpsLatitude: data.gpsLatitude ?? null,
    gpsLongitude: data.gpsLongitude ?? null,
    associatedDate: data.associatedDate ?? null,
    associatedItineraryItemId: data.associatedItineraryItemId ?? null,
  }).returning();
  return photo;
}

export async function updatePhotoAssociation(
  id: string,
  data: { associatedDate?: string; associatedItineraryItemId?: string | null }
) {
  const [photo] = await db.update(photoAssets).set(data).where(eq(photoAssets.id, id)).returning();
  return photo;
}

export async function deletePhoto(id: string) {
  await db.delete(photoAssets).where(eq(photoAssets.id, id));
}
