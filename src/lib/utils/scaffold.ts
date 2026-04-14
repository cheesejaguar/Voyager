import { format } from "date-fns";

interface FlightDates { departureTime: Date; arrivalTime: Date; }
interface HotelDates { checkIn: Date; checkOut: Date; }

export function computeTripDates(
  flights: FlightDates[],
  hotels: HotelDates[]
): { startDate: string | null; endDate: string | null } {
  const allDates: Date[] = [];
  for (const f of flights) { allDates.push(f.departureTime, f.arrivalTime); }
  for (const h of hotels) { allDates.push(h.checkIn, h.checkOut); }
  if (allDates.length === 0) return { startDate: null, endDate: null };
  const sorted = allDates.sort((a, b) => a.getTime() - b.getTime());
  return {
    startDate: format(sorted[0], "yyyy-MM-dd"),
    endDate: format(sorted[sorted.length - 1], "yyyy-MM-dd"),
  };
}

export function inferFlightDirection(
  segments: { departureTime: Date }[]
): ("outbound" | "return")[] {
  if (segments.length === 0) return [];
  const sorted = [...segments].sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
  const midpoint = Math.ceil(sorted.length / 2);
  return sorted.map((_, i) => (i < midpoint ? "outbound" : "return"));
}

export function computeDestinations(
  flights: { departureAirport: string; arrivalAirport: string }[],
  homeAirport: string
): string[] {
  if (flights.length === 0) return [];

  // Split into outbound (first half) and return (second half).
  const midpoint = Math.ceil(flights.length / 2);
  const outboundFlights = flights.slice(0, midpoint);

  // Walk the outbound chain. A "destination" is an arrival airport where
  // the NEXT flight departs from a DIFFERENT airport (meaning you traveled
  // on the ground — a real stop, not a connection). The final outbound
  // arrival is always a destination.
  const destinations: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < outboundFlights.length; i++) {
    const arrival = outboundFlights[i].arrivalAirport;
    if (arrival === homeAirport || seen.has(arrival)) continue;

    const isLast = i === outboundFlights.length - 1;
    const nextDeparture = outboundFlights[i + 1]?.departureAirport;

    // It's a destination if: it's the final outbound arrival, OR
    // the next flight departs from a different airport (ground travel between cities).
    // If next flight departs from the same airport, it's a connection/layover.
    if (isLast || nextDeparture !== arrival) {
      seen.add(arrival);
      destinations.push(arrival);
    }
  }

  return destinations;
}
