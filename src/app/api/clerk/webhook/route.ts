import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import {
  createUser,
  updateUser,
  deleteUserByClerkId,
} from "@/lib/db/queries/users";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } =
        event.data;
      const email = email_addresses[0]?.email_address;
      if (!email) break;
      await createUser({
        clerkId: id,
        email,
        name:
          [first_name, last_name].filter(Boolean).join(" ") || undefined,
        avatarUrl: image_url || undefined,
      });
      break;
    }
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } =
        event.data;
      const email = email_addresses[0]?.email_address;
      await updateUser(id, {
        email,
        name:
          [first_name, last_name].filter(Boolean).join(" ") || undefined,
        avatarUrl: image_url || undefined,
      });
      break;
    }
    case "user.deleted": {
      if (event.data.id) {
        await deleteUserByClerkId(event.data.id);
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
