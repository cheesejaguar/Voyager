import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/db/queries/users";

/**
 * Get the current authenticated user, creating a DB record if needed.
 * Returns null if not authenticated.
 */
export async function requireUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const user = await getOrCreateUser(
    clerkId,
    clerkUser.emailAddresses[0]?.emailAddress ?? "",
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || undefined,
    clerkUser.imageUrl || undefined,
  );

  return user;
}
