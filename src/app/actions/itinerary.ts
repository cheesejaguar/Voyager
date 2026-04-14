"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById } from "@/lib/db/queries/trips";
import {
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  moveItineraryItem,
} from "@/lib/db/queries/itinerary";

async function requireTripAccess(tripId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");
  return { user, trip };
}

export async function addItineraryItemAction(data: {
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
}) {
  await requireTripAccess(data.tripId);
  const item = await createItineraryItem(data);
  revalidatePath(`/trip/${data.tripId}/itinerary`);
  return item;
}

export async function updateItineraryItemAction(
  tripId: string,
  itemId: string,
  data: Partial<{
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    notes: string | null;
    category: string | null;
  }>
) {
  await requireTripAccess(tripId);
  const item = await updateItineraryItem(itemId, data);
  revalidatePath(`/trip/${tripId}/itinerary`);
  return item;
}

export async function deleteItineraryItemAction(tripId: string, itemId: string) {
  await requireTripAccess(tripId);
  await deleteItineraryItem(itemId);
  revalidatePath(`/trip/${tripId}/itinerary`);
}

export async function moveItineraryItemAction(
  tripId: string,
  itemId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string
) {
  await requireTripAccess(tripId);
  const item = await moveItineraryItem(itemId, newDate, newStartTime, newEndTime);
  revalidatePath(`/trip/${tripId}/itinerary`);
  return item;
}
