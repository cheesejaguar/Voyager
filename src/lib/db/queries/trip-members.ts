import { db } from "@/lib/db";
import { tripMembers, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function getTripMembers(tripId: string) {
  return db.select({ member: tripMembers, user: users })
    .from(tripMembers)
    .innerJoin(users, eq(tripMembers.userId, users.id))
    .where(eq(tripMembers.tripId, tripId));
}

export async function inviteMember(tripId: string, userId: string) {
  const [member] = await db.insert(tripMembers).values({
    tripId, userId, role: "member",
  }).returning();
  return member;
}

export async function acceptInvitation(tripId: string, userId: string) {
  const [member] = await db.update(tripMembers)
    .set({ joinedAt: new Date() })
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)))
    .returning();
  return member;
}

export async function removeMember(tripId: string, memberId: string) {
  await db.delete(tripMembers).where(eq(tripMembers.id, memberId));
}

export async function getPendingInvitations(userId: string) {
  return db.select({ member: tripMembers })
    .from(tripMembers)
    .where(and(eq(tripMembers.userId, userId), isNull(tripMembers.joinedAt)));
}
