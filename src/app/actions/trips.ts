"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { createTrip, updateTrip, deleteTrip, isUserTripOwner } from "@/lib/db/queries/trips";

export async function createTripAction(formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const title = formData.get("title") as string;
  if (!title?.trim()) throw new Error("Title is required");
  const tripId = await createTrip(title.trim(), user.id);
  revalidatePath("/dashboard");
  redirect(`/trip/${tripId}/overview`);
}

export async function updateTripAction(tripId: string, formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const title = formData.get("title") as string;
  if (!title?.trim()) throw new Error("Title is required");
  await updateTrip(tripId, { title: title.trim() });
  revalidatePath("/dashboard");
  revalidatePath(`/trip/${tripId}`);
}

export async function deleteTripAction(tripId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const isOwner = await isUserTripOwner(tripId, user.id);
  if (!isOwner) throw new Error("Only the trip owner can delete a trip");
  await deleteTrip(tripId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
