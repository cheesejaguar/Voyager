import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByClerkId(clerkId: string) {
  const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return result[0] ?? null;
}

/**
 * Get or create a user record from Clerk data.
 * This handles the case where the webhook hasn't fired yet —
 * creates the DB user on first access so the app works immediately after sign-up.
 */
export async function getOrCreateUser(clerkId: string, email: string, name?: string, avatarUrl?: string) {
  const existing = await getUserByClerkId(clerkId);
  if (existing) return existing;

  const result = await db.insert(users).values({
    clerkId,
    email,
    name: name ?? null,
    avatarUrl: avatarUrl ?? null,
  }).onConflictDoNothing({ target: users.clerkId }).returning();

  // If insert was a no-op due to race condition, fetch again
  if (result.length === 0) {
    return getUserByClerkId(clerkId);
  }

  return result[0];
}

export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function updateUser(
  clerkId: string,
  data: { email?: string; name?: string; avatarUrl?: string },
) {
  const result = await db
    .update(users)
    .set(data)
    .where(eq(users.clerkId, clerkId))
    .returning();
  return result[0];
}

export async function deleteUserByClerkId(clerkId: string) {
  await db.delete(users).where(eq(users.clerkId, clerkId));
}
