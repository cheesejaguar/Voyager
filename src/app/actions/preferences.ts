"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById } from "@/lib/db/queries/trips";
import { db } from "@/lib/db";
import { trips } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { TravelPreferences } from "@/types/preferences";

export async function updateTripPreferencesAction(tripId: string, preferences: Partial<TravelPreferences>) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");

  const existing = (trip.preferenceOverrides as Partial<TravelPreferences>) ?? {};
  const merged = { ...existing, ...preferences };

  await db.update(trips).set({ preferenceOverrides: merged }).where(eq(trips.id, tripId));
  revalidatePath(`/trip/${tripId}`);
  return { success: true };
}
