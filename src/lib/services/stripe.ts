import Stripe from "stripe";

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export const stripe = {
  webhooks: {
    constructEvent: (body: string, sig: string, secret: string) =>
      getStripe().webhooks.constructEvent(body, sig, secret),
  },
  checkout: {
    sessions: {
      create: (params: Parameters<Stripe["checkout"]["sessions"]["create"]>[0]) =>
        getStripe().checkout.sessions.create(params),
    },
  },
};

export async function createCheckoutSession(userId: string, email: string) {
  const client = getStripe();
  const session = await client.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    customer_email: email,
    metadata: { userId },
  });
  return session;
}
