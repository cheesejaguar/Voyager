import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById } from "@/lib/db/queries/trips";
import { getTripSummaries } from "@/lib/db/queries/summaries";
import { RecapClient } from "./recap-client";

export default async function RecapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");
  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  const summaries = await getTripSummaries(tripId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Trip Recap</h1>
      <RecapClient tripId={tripId} summaries={summaries} />
    </div>
  );
}
