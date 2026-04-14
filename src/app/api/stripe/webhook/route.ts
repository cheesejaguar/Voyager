import { headers } from "next/headers";
import { stripe } from "@/lib/services/stripe";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const sig = headerPayload.get("stripe-signature");

  if (!sig) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      // Create subscription record
      await db.insert(subscriptions).values({
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        plan: "premium",
        status: "active",
      });

      // Update user tier
      await db.update(users).set({ subscriptionTier: "premium" }).where(eq(users.id, userId));
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled";
      await db.update(subscriptions).set({ status }).where(eq(subscriptions.stripeSubscriptionId, sub.id));

      if (status === "canceled") {
        // Find user and downgrade
        const [subRecord] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, sub.id));
        if (subRecord) {
          await db.update(users).set({ subscriptionTier: "free" }).where(eq(users.id, subRecord.userId));
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db.update(subscriptions).set({ status: "canceled" }).where(eq(subscriptions.stripeSubscriptionId, sub.id));
      const [subRecord] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, sub.id));
      if (subRecord) {
        await db.update(users).set({ subscriptionTier: "free" }).where(eq(users.id, subRecord.userId));
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
