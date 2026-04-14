import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface FlightCardProps {
  airline: string | null;
  flightNumber: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  departureTime: Date | null;
  arrivalTime: Date | null;
  terminal: string | null;
  gate: string | null;
  cabinClass: string | null;
  seat: string | null;
  status: string | null;
}

export function FlightCard({
  airline, flightNumber, departureAirport, arrivalAirport,
  departureTime, arrivalTime, terminal, gate, cabinClass, seat, status,
}: FlightCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{airline}</span>
            <span className="text-text-secondary">{flightNumber}</span>
          </div>
          <Badge variant={status === "scheduled" ? "default" : "accent"}>{status ?? "unknown"}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold">{departureAirport}</div>
            {departureTime && (
              <div className="text-sm text-text-muted">{format(departureTime, "h:mm a")}</div>
            )}
            {departureTime && (
              <div className="text-xs text-text-muted">{format(departureTime, "MMM d")}</div>
            )}
          </div>

          <div className="flex-1 mx-6 relative">
            <div className="border-t border-border border-dashed" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2">
              <span className="text-xs text-text-muted">→</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold">{arrivalAirport}</div>
            {arrivalTime && (
              <div className="text-sm text-text-muted">{format(arrivalTime, "h:mm a")}</div>
            )}
            {arrivalTime && (
              <div className="text-xs text-text-muted">{format(arrivalTime, "MMM d")}</div>
            )}
          </div>
        </div>

        {(terminal || gate || cabinClass || seat) && (
          <div className="mt-3 flex gap-3 text-xs text-text-muted">
            {terminal && <span>Terminal {terminal}</span>}
            {gate && <span>Gate {gate}</span>}
            {cabinClass && <span>{cabinClass}</span>}
            {seat && <span>Seat {seat}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
