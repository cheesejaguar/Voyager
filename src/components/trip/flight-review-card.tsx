import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane } from "lucide-react";
import type { FlightExtraction } from "@/lib/ai/schemas";

interface FlightReviewCardProps {
  data: FlightExtraction;
}

export function FlightReviewCard({ data }: FlightReviewCardProps) {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <Plane className="h-4 w-4 text-accent" />
        Flight: {data.airline} {data.flightNumber}
      </CardTitle>
      <CardContent className="mt-3 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="accent">Confirmation: {data.confirmationCode}</Badge>
        </div>
        <div className="text-sm text-text-secondary">
          Passengers: {data.passengerNames.join(", ")}
        </div>
        <div className="space-y-2">
          {data.segments.map((seg, i) => (
            <div key={i} className="rounded-lg bg-surface p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{seg.departureAirport} → {seg.arrivalAirport}</span>
                {seg.cabinClass && <Badge variant="default">{seg.cabinClass}</Badge>}
              </div>
              <div className="mt-1 text-text-muted">
                {new Date(seg.departureTime).toLocaleString()} → {new Date(seg.arrivalTime).toLocaleString()}
              </div>
              {(seg.terminal || seg.gate || seg.seat) && (
                <div className="mt-1 text-text-muted text-xs">
                  {seg.terminal && `Terminal ${seg.terminal}`}
                  {seg.gate && ` / Gate ${seg.gate}`}
                  {seg.seat && ` / Seat ${seg.seat}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
