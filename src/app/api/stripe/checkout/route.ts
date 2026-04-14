import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { createCheckoutSession } from "@/lib/services/stripe";

export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  if (user.subscriptionTier === "premium") {
    return Response.json({ error: "Already premium" }, { status: 400 });
  }

  const session = await createCheckoutSession(user.id, user.email);
  return Response.json({ url: session.url });
}
