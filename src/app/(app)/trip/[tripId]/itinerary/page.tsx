import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById } from "@/lib/db/queries/trips";
import { getItineraryForTrip } from "@/lib/db/queries/itinerary";
import { ItineraryView } from "@/components/calendar/itinerary-view";
import { PreferencePanel } from "@/components/trip/preference-panel";
import type { TravelPreferences } from "@/types/preferences";

export default async function ItineraryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");
  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  const items = await getItineraryForTrip(tripId);
  const preferences = (trip.preferenceOverrides as Partial<TravelPreferences>) ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Itinerary</h1>
      <ItineraryView
        tripId={tripId}
        items={items}
        startDate={trip.startDate}
        endDate={trip.endDate}
      />
      <PreferencePanel tripId={tripId} currentPreferences={preferences} />
    </div>
  );
}
