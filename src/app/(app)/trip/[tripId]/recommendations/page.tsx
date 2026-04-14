import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { getRecommendationsForTrip } from "@/lib/db/queries/recommendations";
import { RecommendationList } from "@/components/recommendations/recommendation-list";
import { FadeIn } from "@/components/ui/motion";

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await requireUser();
  if (!user) redirect("/sign-in");

  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  const recommendations = await getRecommendationsForTrip(tripId);
  const tripData = await getTripWithFlights(tripId);
  const hotels = tripData?.hotels ?? [];
  const anchorHotel = hotels[0];

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">Recommendations</h1>
      </FadeIn>
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
