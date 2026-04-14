import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById } from "@/lib/db/queries/trips";
import { getPhotosForTrip } from "@/lib/db/queries/photos";
import { PhotosClient } from "./photos-client";

export default async function PhotosPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");
  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  const photos = await getPhotosForTrip(tripId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Photos</h1>
      <PhotosClient tripId={tripId} initialPhotos={photos} />
    </div>
  );
}
