"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { isUserTripOwner } from "@/lib/db/queries/trips";
import { inviteMember, removeMember, acceptInvitation } from "@/lib/db/queries/trip-members";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function inviteMemberAction(tripId: string, email: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  const isOwner = await isUserTripOwner(tripId, user.id);
  if (!isOwner) throw new Error("Only the trip owner can invite members");

  // Find user by email
  const [invitee] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!invitee) return { success: false, error: "No user found with that email. They need to sign up first." };

  if (invitee.id === user.id) return { success: false, error: "You can't invite yourself." };

  await inviteMember(tripId, invitee.id);
  revalidatePath(`/trip/${tripId}`);
  return { success: true };
}

export async function removeMemberAction(tripId: string, memberId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  const isOwner = await isUserTripOwner(tripId, user.id);
  if (!isOwner) throw new Error("Only the trip owner can remove members");

  await removeMember(tripId, memberId);
  revalidatePath(`/trip/${tripId}`);
}

export async function acceptInvitationAction(tripId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  await acceptInvitation(tripId, user.id);
  revalidatePath("/dashboard");
  revalidatePath(`/trip/${tripId}`);
}
