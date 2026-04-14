import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import type { HotelExtraction } from "@/lib/ai/schemas";

interface HotelReviewCardProps {
  data: HotelExtraction;
}

export function HotelReviewCard({ data }: HotelReviewCardProps) {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-accent" />
        Hotel: {data.hotelName}
      </CardTitle>
      <CardContent className="mt-3 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="accent">Confirmation: {data.confirmationNumber}</Badge>
        </div>
        <div className="rounded-lg bg-surface p-3 text-sm space-y-1">
          <div className="text-text-secondary">{data.address}</div>
          <div className="text-text-muted">Check-in: {new Date(data.checkIn).toLocaleString()}</div>
          <div className="text-text-muted">Check-out: {new Date(data.checkOut).toLocaleString()}</div>
          {data.roomType && <div className="text-text-muted">Room: {data.roomType}</div>}
          {data.guestCount && <div className="text-text-muted">Guests: {data.guestCount}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
