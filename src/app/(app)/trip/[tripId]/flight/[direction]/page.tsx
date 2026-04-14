import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { FlightCard } from "@/components/trip/flight-card";
import { SegmentTimeline } from "@/components/trip/segment-timeline";
import { Card, CardContent } from "@/components/ui/card";
import { PlaneTakeoff, PlaneLanding, Clock } from "lucide-react";
import { format, subHours } from "date-fns";

export default async function FlightPage({
  params,
}: {
  params: Promise<{ tripId: string; direction: string }>;
}) {
  const { tripId, direction } = await params;
  const user = await requireUser();
  if (!user) redirect("/sign-in");

  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  if (direction !== "outbound" && direction !== "return") notFound();

  const tripData = await getTripWithFlights(tripId);
  const allFlights = tripData?.flights ?? [];
  const flights = allFlights.filter((f) => f.direction === direction).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const isOutbound = direction === "outbound";
  const Icon = isOutbound ? PlaneTakeoff : PlaneLanding;
  const title = isOutbound ? "Outbound Flight" : "Return Flight";

  // Group flights by connection_group
  const groups = new Map<string, typeof flights>();
  for (const f of flights) {
    const key = f.connectionGroup ?? f.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  // Leave-by calculator for return flights
  let leaveByTime: Date | null = null;
  if (direction === "return" && flights.length > 0 && flights[0].departureTime) {
    const bufferHours = 3; // international buffer
    leaveByTime = subHours(flights[0].departureTime, bufferHours);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-accent" />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>

      {flights.length === 0 ? (
        <p className="text-sm text-text-muted">
          No {direction} flights found. Import a flight confirmation from the Overview page.
        </p>
      ) : (
        <>
          {/* Segment Timeline */}
          {flights.length > 1 && <SegmentTimeline segments={flights} />}

          {/* Leave-by Calculator (return only) */}
          {leaveByTime && (
            <Card className="bg-accent-muted border-accent/20">
              <CardContent className="flex items-center gap-3 py-3">
                <Clock className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-accent">
                    Leave hotel by {format(leaveByTime, "h:mm a")}
                  </p>
                  <p className="text-xs text-text-muted">
                    Includes 3-hour airport buffer before {format(flights[0].departureTime!, "h:mm a")} departure
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flight Cards */}
          <div className="space-y-4">
            {flights.map((f) => (
              <FlightCard
                key={f.id}
                airline={f.airline}
                flightNumber={f.flightNumber}
                departureAirport={f.departureAirport}
                arrivalAirport={f.arrivalAirport}
                departureTime={f.departureTime}
                arrivalTime={f.arrivalTime}
                terminal={f.terminal}
                gate={f.gate}
                cabinClass={f.cabinClass}
                seat={f.seat}
                status={f.status}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
