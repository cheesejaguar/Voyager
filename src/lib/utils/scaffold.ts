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
  const seen = new Set<string>();
  const destinations: string[] = [];
  for (const f of flights) {
    for (const airport of [f.departureAirport, f.arrivalAirport]) {
      if (airport !== homeAirport && !seen.has(airport)) {
        seen.add(airport);
        destinations.push(airport);
      }
    }
  }
  return destinations;
}
