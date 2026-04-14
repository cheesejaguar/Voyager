"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById } from "@/lib/db/queries/trips";
import { updateRecommendationStatus } from "@/lib/db/queries/recommendations";
import { createItineraryItem } from "@/lib/db/queries/itinerary";

export async function addRecommendationToItinerary(
  tripId: string,
  recommendationId: string,
  data: {
    date: string;
    startTime: string;
    endTime: string;
    name: string;
    category: string;
    description: string;
    locationName?: string;
    latitude?: number;
    longitude?: number;
  }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");

  // Create itinerary item from recommendation
  await createItineraryItem({
    tripId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    type: "activity",
    title: data.name,
    description: data.description,
    locationName: data.locationName,
    latitude: data.latitude,
    longitude: data.longitude,
    category: data.category,
    source: "recommendation",
  });

  // Mark recommendation as added
  await updateRecommendationStatus(recommendationId, "added");

  revalidatePath(`/trip/${tripId}/itinerary`);
  revalidatePath(`/trip/${tripId}/recommendations`);
  return { success: true };
}

export async function saveRecommendationAction(tripId: string, recommendationId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  await getTripById(tripId, user.id); // verify access

  await updateRecommendationStatus(recommendationId, "saved");
  revalidatePath(`/trip/${tripId}/recommendations`);
  return { success: true };
}

export async function dismissRecommendationAction(tripId: string, recommendationId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  await getTripById(tripId, user.id);

  await updateRecommendationStatus(recommendationId, "dismissed");
  revalidatePath(`/trip/${tripId}/recommendations`);
  return { success: true };
}
