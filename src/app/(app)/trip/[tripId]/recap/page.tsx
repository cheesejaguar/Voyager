import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTripById } from "@/lib/db/queries/trips";
import { getTripSummaries } from "@/lib/db/queries/summaries";
import { RecapClient } from "./recap-client";

export default async function RecapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const user = await requireUser();
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
