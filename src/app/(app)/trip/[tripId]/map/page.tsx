import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { getItineraryForTrip } from "@/lib/db/queries/itinerary";
import { getRecommendationsForTrip } from "@/lib/db/queries/recommendations";
import { TripMap } from "@/components/map/trip-map";

export default async function MapPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await requireUser();
  if (!user) redirect("/sign-in");

  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  const tripData = await getTripWithFlights(tripId);
  const hotels = tripData?.hotels ?? [];
  const itineraryItems = await getItineraryForTrip(tripId);
  const recommendations = await getRecommendationsForTrip(tripId);

  const hotelMarkers = hotels
    .filter((h) => h.latitude != null && h.longitude != null)
    .map((h) => ({
      type: "hotel" as const,
      lat: h.latitude!,
      lng: h.longitude!,
      name: h.hotelName ?? "Hotel",
    }));

  const itineraryMarkers = itineraryItems
    .filter((i) => i.latitude != null && i.longitude != null)
    .map((i) => ({
      type: "itinerary" as const,
      lat: i.latitude!,
      lng: i.longitude!,
      name: i.title,
      category: i.category,
    }));

  const recMarkers = recommendations
    .filter(
      (r) =>
        r.latitude != null &&
        r.longitude != null &&
        r.status !== "dismissed" &&
        r.status !== "added"
    )
    .map((r) => ({
      type: "recommendation" as const,
      lat: r.latitude!,
      lng: r.longitude!,
      name: r.name,
      category: r.category,
      id: r.id,
    }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Map</h1>
      <div className="h-[600px] rounded-xl overflow-hidden border border-border">
        <TripMap
          hotelMarkers={hotelMarkers}
          itineraryMarkers={itineraryMarkers}
          recommendationMarkers={recMarkers}
        />
      </div>
    </div>
  );
}
