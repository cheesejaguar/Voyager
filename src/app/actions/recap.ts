"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById } from "@/lib/db/queries/trips";
import { getItineraryForTrip } from "@/lib/db/queries/itinerary";
import { getPhotosForTrip } from "@/lib/db/queries/photos";
import { upsertTripSummary } from "@/lib/db/queries/summaries";
import { generateRecap } from "@/lib/ai/generate-recap";

export async function generateRecapAction(tripId: string, style: "concise" | "narrative" | "scrapbook") {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");

  const itinerary = await getItineraryForTrip(tripId);
  const photos = await getPhotosForTrip(tripId);

  const content = await generateRecap({
    destinations: trip.destinations ?? [],
    startDate: trip.startDate ?? "",
    endDate: trip.endDate ?? "",
    itinerary: itinerary.map((i) => ({ date: i.date ?? "", title: i.title, category: i.category })),
    photoCount: photos.length,
    style,
    isPremium: user.subscriptionTier === "premium",
  });

  await upsertTripSummary(tripId, style, content);
  revalidatePath(`/trip/${tripId}/recap`);
  return { success: true };
}
