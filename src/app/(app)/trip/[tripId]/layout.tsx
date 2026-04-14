import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { PhaseRail } from "@/components/trip/phase-rail";
import { computePhase } from "@/lib/utils/trip-phases";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await requireUser();
  if (!user) redirect("/sign-in");

  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  const tripWithFlights = await getTripWithFlights(tripId);
  const flights = (tripWithFlights?.flights ?? [])
    .map((f) => ({
      direction: f.direction as "outbound" | "return",
      departureTime: f.departureTime!,
      arrivalTime: f.arrivalTime!,
    }))
    .filter((f) => f.departureTime && f.arrivalTime);

  const currentPhase = computePhase({ flights }, new Date());

  return (
    <div className="flex flex-col md:flex-row gap-0 -mx-4 md:-mx-6 -my-6 md:-my-8 min-h-screen md:h-screen">
      <PhaseRail tripId={tripId} currentPhase={currentPhase} />
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8">{children}</div>
    </div>
  );
}
