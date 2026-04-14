import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById } from "@/lib/db/queries/trips";
import { getItineraryForDay } from "@/lib/db/queries/itinerary";
import { createRecommendations, deleteRecommendationsForDay } from "@/lib/db/queries/recommendations";
import { generateRecommendations } from "@/lib/ai/generate-recommendations";
import { searchPlaces } from "@/lib/services/foursquare";
import { getWalkingDirections } from "@/lib/services/mapbox";
import type { TravelPreferences } from "@/types/preferences";
import { defaultPreferences } from "@/types/preferences";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const { tripId, date, anchorLat, anchorLng } = await req.json();

  const trip = await getTripById(tripId, user.id);
  if (!trip) return Response.json({ error: "Trip not found" }, { status: 404 });

  const preferences = { ...defaultPreferences, ...(trip.preferenceOverrides as Partial<TravelPreferences> ?? {}) };

  // Prefer hotel name/address as destination context (more accurate than airport codes).
  // Fall back to trip destinations (airport codes) if no hotel.
  const { getTripWithFlights } = await import("@/lib/db/queries/trips");
  const tripData = await getTripWithFlights(tripId);
  const hotels = tripData?.hotels ?? [];
  const hotelCity = hotels[0]?.address ?? hotels[0]?.hotelName;
  const destination = hotelCity ?? trip.destinations?.join(", ") ?? "the destination";

  // Get existing itinerary for context
  const existingItems = await getItineraryForDay(tripId, date);
  const existingTitles = existingItems.map((i) => i.title);

  // Compute time gaps (simplified: just list existing time ranges)
  const timeGaps = existingItems.length === 0
    ? ["full day open"]
    : [`${existingItems.length} activities planned`];

  // Stage 1: LLM Generation
  const aiRecs = await generateRecommendations({
    destination, date, preferences, existingItems: existingTitles, timeGaps,
  });

  // Stage 2: Foursquare Enrichment (if we have anchor coordinates)
  const enrichedRecs = await Promise.all(
    aiRecs.map(async (rec) => {
      let enriched = { ...rec, latitude: undefined as number | undefined, longitude: undefined as number | undefined, rating: undefined as number | undefined, priceLevel: undefined as number | undefined, foursquareId: undefined as string | undefined, photoUrl: undefined as string | undefined, distanceFromAnchor: undefined as string | undefined };

      if (anchorLat && anchorLng) {
        const fsqPlace = await searchPlaces(rec.name, anchorLat, anchorLng);
        if (fsqPlace) {
          enriched.latitude = fsqPlace.latitude;
          enriched.longitude = fsqPlace.longitude;
          enriched.rating = fsqPlace.rating;
          enriched.priceLevel = fsqPlace.priceLevel;
          enriched.foursquareId = fsqPlace.fsqId;
          enriched.photoUrl = fsqPlace.photoUrl;

          // Calculate walking distance from anchor
          const directions = await getWalkingDirections(anchorLat, anchorLng, fsqPlace.latitude, fsqPlace.longitude);
          if (directions) {
            enriched.distanceFromAnchor = `${directions.durationMinutes}-min walk`;
          }
        }
      }

      return enriched;
    })
  );

  // Save to DB (clear old recs for this day first)
  await deleteRecommendationsForDay(tripId, date);
  const saved = await createRecommendations(tripId, date, enrichedRecs);

  return Response.json({ recommendations: saved });
}
