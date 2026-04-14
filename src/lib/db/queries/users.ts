import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByClerkId(clerkId: string) {
  const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return result[0] ?? null;
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
