"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { differenceInDays, differenceInHours, format } from "date-fns";

interface CountdownProps {
  departureDate: string;
  departureAirport?: string;
}

export function Countdown({ departureDate, departureAirport }: CountdownProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle both ISO timestamps ("2025-06-01T10:00:00Z") and date-only strings ("2025-06-01")
  const departure = new Date(departureDate);
  const hasTime = departureDate.includes("T");
  const days = differenceInDays(departure, now);
  const hours = differenceInHours(departure, now) % 24;
  const isPast = departure < now;

  return (
    <Card className="bg-accent-muted border-accent/20">
      <CardContent>
        {isPast ? (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-accent">Trip in progress!</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="flex items-baseline justify-center gap-3">
              <div>
                <span className="text-4xl font-bold text-accent">{days}</span>
                <span className="ml-1 text-sm text-text-secondary">days</span>
              </div>
              <div>
                <span className="text-4xl font-bold text-accent">{hours}</span>
                <span className="ml-1 text-sm text-text-secondary">hours</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-text-muted">
              until departure
              {hasTime && ` at ${format(departure, "h:mm a")}`}
              {departureAirport ? ` from ${departureAirport}` : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
