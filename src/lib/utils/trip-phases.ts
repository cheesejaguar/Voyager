import type { TripPhase, TripWithFlights } from "@/types/trip";

export function computePhase(trip: TripWithFlights, now: Date): TripPhase {
  const outboundFlights = trip.flights.filter((f) => f.direction === "outbound");
  const returnFlights = trip.flights.filter((f) => f.direction === "return");

  const outboundDeparture = outboundFlights
    .map((f) => f.departureTime)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const outboundArrival = outboundFlights
    .map((f) => f.arrivalTime)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const returnDeparture = returnFlights
    .map((f) => f.departureTime)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const returnArrival = returnFlights
    .map((f) => f.arrivalTime)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!outboundDeparture || now < outboundDeparture) return "pre_trip";
  if (!outboundArrival || now < outboundArrival) return "outbound_flight";
  if (!returnDeparture || now < returnDeparture) return "trip";
  if (!returnArrival || now < returnArrival) return "return_flight";
  return "post_trip";
}
