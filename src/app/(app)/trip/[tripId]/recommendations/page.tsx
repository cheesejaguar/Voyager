import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { getRecommendationsForTrip } from "@/lib/db/queries/recommendations";
import { RecommendationList } from "@/components/recommendations/recommendation-list";

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  const recommendations = await getRecommendationsForTrip(tripId);
  const tripData = await getTripWithFlights(tripId);
  const hotels = tripData?.hotels ?? [];
  const anchorHotel = hotels[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Recommendations</h1>
      <RecommendationList
        tripId={tripId}
        recommendations={recommendations}
        startDate={trip.startDate}
        endDate={trip.endDate}
        anchorLat={anchorHotel?.latitude ?? undefined}
        anchorLng={anchorHotel?.longitude ?? undefined}
      />
    </div>
  );
}
