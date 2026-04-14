import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plane, Building2 } from "lucide-react";
import { format } from "date-fns";
import { EmailPastePanel } from "@/components/trip/email-paste-panel";

export default async function TripOverviewPage({
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

  const tripData = await getTripWithFlights(tripId);
  const flights = tripData?.flights ?? [];
  const hotels = tripData?.hotels ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{trip.title}</h1>
          {trip.destinations && trip.destinations.length > 0 && (
            <div className="mt-1 flex items-center gap-1 text-text-secondary text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {trip.destinations.join(" → ")}
            </div>
          )}
        </div>
        <Badge variant="accent">{trip.status}</Badge>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-accent" />
            Flights
          </CardTitle>
          <CardContent className="mt-3">
            {flights.length === 0 ? (
              <p className="text-sm text-text-muted">No flights added yet. Paste a confirmation email to get started.</p>
            ) : (
              <div className="space-y-2">
                {flights.map((f) => (
                  <div key={f.id} className="text-sm">
                    <span className="text-text-primary">{f.departureAirport} → {f.arrivalAirport}</span>
                    {f.departureTime && (
                      <span className="ml-2 text-text-muted">{format(f.departureTime, "MMM d, h:mm a")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            Hotels
          </CardTitle>
          <CardContent className="mt-3">
            {hotels.length === 0 ? (
              <p className="text-sm text-text-muted">No hotels added yet. Paste a confirmation email to get started.</p>
            ) : (
              <div className="space-y-2">
                {hotels.map((h) => (
                  <div key={h.id} className="text-sm">
                    <span className="text-text-primary">{h.hotelName}</span>
                    {h.checkIn && h.checkOut && (
                      <span className="ml-2 text-text-muted">{format(h.checkIn, "MMM d")} – {format(h.checkOut, "MMM d")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <EmailPastePanel tripId={tripId} />
      </div>
    </div>
  );
}
