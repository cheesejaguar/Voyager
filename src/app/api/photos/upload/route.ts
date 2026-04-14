import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById } from "@/lib/db/queries/trips";
import { createPhotoAsset } from "@/lib/db/queries/photos";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const tripId = formData.get("tripId") as string;
  const takenAt = formData.get("takenAt") as string | null;
  const gpsLatitude = formData.get("gpsLatitude") as string | null;
  const gpsLongitude = formData.get("gpsLongitude") as string | null;
  const associatedDate = formData.get("associatedDate") as string | null;

  if (!file || !tripId) {
    return Response.json({ error: "File and tripId required" }, { status: 400 });
  }

  const trip = await getTripById(tripId, user.id);
  if (!trip) return Response.json({ error: "Trip not found" }, { status: 404 });

  // Upload to Vercel Blob
  const blob = await put(`voyager/${tripId}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  // Save to DB
  const photo = await createPhotoAsset({
    tripId,
    blobUrl: blob.url,
    filename: file.name,
    takenAt: takenAt ? new Date(takenAt) : undefined,
    gpsLatitude: gpsLatitude ? parseFloat(gpsLatitude) : undefined,
    gpsLongitude: gpsLongitude ? parseFloat(gpsLongitude) : undefined,
    associatedDate: associatedDate ?? undefined,
  });

  return Response.json({ photo });
}
