import Link from "next/link";
import { MapPin, Calendar, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface TripCardProps {
  id: string;
  title: string;
  destinations: string[] | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  memberRole: string;
}

export function TripCard({ id, title, destinations, startDate, endDate, status, memberRole }: TripCardProps) {
  return (
    <Link href={`/trip/${id}/overview`}>
      <Card className="transition-colors duration-200 hover:bg-card-hover cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            {destinations && destinations.length > 0 && (
              <div className="mt-1 flex items-center gap-1 text-text-secondary text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {destinations.join(" → ")}
              </div>
            )}
            {startDate && endDate && (
              <div className="mt-1 flex items-center gap-1 text-text-muted text-xs">
                <Calendar className="h-3 w-3" />
                {format(new Date(startDate), "MMM d")} – {format(new Date(endDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {memberRole === "member" && (
              <Badge variant="default">
                <Users className="mr-1 h-3 w-3" />
                Shared
              </Badge>
            )}
            <Badge variant={status === "active" ? "accent" : "default"}>{status}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
