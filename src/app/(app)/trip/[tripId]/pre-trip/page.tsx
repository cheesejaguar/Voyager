import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { getPackingItems } from "@/lib/db/queries/packing";
import { getPreTripTasks } from "@/lib/db/queries/pre-trip-tasks";
import { Countdown } from "@/components/trip/countdown";
import { PackingList } from "@/components/trip/packing-list";
import { Checklist } from "@/components/trip/checklist";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Building2 } from "lucide-react";
import { format } from "date-fns";
import { FadeIn } from "@/components/ui/motion";

export default async function PreTripPage({
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
  const flights = tripData?.flights ?? [];
  const hotels = tripData?.hotels ?? [];
  const packingItems = await getPackingItems(tripId);
  const preTripTasks = await getPreTripTasks(tripId);

  const outboundFlights = flights
    .filter((f) => f.direction === "outbound")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const firstDeparture = outboundFlights[0];

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">Pre-Trip</h1>
      </FadeIn>

      {/* Countdown */}
      {trip.startDate && (
        <FadeIn delay={0.1}>
          <Countdown
            departureDate={trip.startDate}
            departureAirport={firstDeparture?.departureAirport ?? undefined}
          />
        </FadeIn>
      )}

      {/* Packing + Tasks Grid */}
      <FadeIn delay={0.2}>
        <div className="grid gap-6 md:grid-cols-2">
          <PackingList tripId={tripId} items={packingItems} />
          <Checklist tripId={tripId} tasks={preTripTasks} />
        </div>
      </FadeIn>

      {/* Reservation Summary */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3">Reservations</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {flights.length > 0 && (
            <Card>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plane className="h-4 w-4 text-accent" />
                Flights
              </CardTitle>
              <CardContent className="mt-2 space-y-2">
                {flights.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <span>{f.departureAirport} → {f.arrivalAirport}</span>
                    <div className="flex items-center gap-2">
                      {f.departureTime && (
                        <span className="text-text-muted text-xs">
                          {format(f.departureTime, "MMM d, h:mm a")}
                        </span>
                      )}
                      {f.confirmationCode && (
                        <Badge variant="default" className="text-xs">{f.confirmationCode}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {hotels.length > 0 && (
            <Card>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-accent" />
                Hotels
              </CardTitle>
              <CardContent className="mt-2 space-y-2">
                {hotels.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <span>{h.hotelName}</span>
                    <div className="flex items-center gap-2">
                      {h.checkIn && h.checkOut && (
                        <span className="text-text-muted text-xs">
                          {format(h.checkIn, "MMM d")} – {format(h.checkOut, "MMM d")}
                        </span>
                      )}
                      {h.confirmationNumber && (
                        <Badge variant="default" className="text-xs">{h.confirmationNumber}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {flights.length === 0 && hotels.length === 0 && (
            <p className="text-sm text-text-muted col-span-2">
              No reservations yet. Go to Overview to import booking emails.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
