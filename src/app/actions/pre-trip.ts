"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { createPackingItems, togglePackingItem, deleteAllPackingItems } from "@/lib/db/queries/packing";
import { createPreTripTasks, togglePreTripTask, deleteAllPreTripTasks } from "@/lib/db/queries/pre-trip-tasks";
import { generatePackingList } from "@/lib/ai/generate-packing-list";
import { generatePreTripTasks } from "@/lib/ai/generate-pre-trip-tasks";
import { differenceInDays } from "date-fns";

async function requireTripAccess(tripId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");
  return { user, trip };
}

export async function generatePackingListAction(tripId: string) {
  const { trip } = await requireTripAccess(tripId);
  if (!trip.startDate || !trip.endDate) throw new Error("Trip dates not set");

  const durationDays = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;
  const destinations = trip.destinations ?? [];
  const weather = { avgHigh: 75, avgLow: 55, rainyDays: 2 };

  const items = await generatePackingList({ destinations, durationDays, weather });
  await deleteAllPackingItems(tripId);
  await createPackingItems(tripId, items);

  revalidatePath(`/trip/${tripId}/pre-trip`);
  return { success: true };
}

export async function togglePackingItemAction(itemId: string, checked: boolean, tripId: string) {
  await requireTripAccess(tripId);
  await togglePackingItem(itemId, checked);
  revalidatePath(`/trip/${tripId}/pre-trip`);
}

export async function generatePreTripTasksAction(tripId: string) {
  const { trip } = await requireTripAccess(tripId);
  if (!trip.startDate) throw new Error("Trip dates not set");

  const tripData = await getTripWithFlights(tripId);
  const destinations = trip.destinations ?? [];
  const flights = tripData?.flights ?? [];
  const hasInternationalFlight = flights.length > 0; // simplified for MVP

  const tasks = await generatePreTripTasks({
    destinations,
    departureDate: trip.startDate,
    hasInternationalFlight,
  });

  await deleteAllPreTripTasks(tripId);
  await createPreTripTasks(tripId, tasks);

  revalidatePath(`/trip/${tripId}/pre-trip`);
  return { success: true };
}

export async function togglePreTripTaskAction(taskId: string, completed: boolean, tripId: string) {
  await requireTripAccess(tripId);
  await togglePreTripTask(taskId, completed);
  revalidatePath(`/trip/${tripId}/pre-trip`);
}
