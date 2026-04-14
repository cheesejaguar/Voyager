"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Luggage, PlaneTakeoff, CalendarDays, PlaneLanding, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripPhase } from "@/types/trip";

interface PhaseRailProps {
  tripId: string;
  currentPhase: TripPhase;
}

const phases = [
  { key: "overview", label: "Overview", icon: LayoutGrid, path: "overview" },
  { key: "pre_trip", label: "Pre-Trip", icon: Luggage, path: "pre-trip" },
  { key: "outbound_flight", label: "Outbound", icon: PlaneTakeoff, path: "flight/outbound" },
  { key: "trip", label: "Trip", icon: CalendarDays, path: "itinerary" },
  { key: "return_flight", label: "Return", icon: PlaneLanding, path: "flight/return" },
  { key: "post_trip", label: "Post-Trip", icon: Camera, path: "photos" },
] as const;

export function PhaseRail({ tripId, currentPhase }: PhaseRailProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 w-48 py-4 pr-4 border-r border-border">
      {phases.map((phase) => {
        const href = `/trip/${tripId}/${phase.path}`;
        const isActive = pathname.startsWith(href);
        const isCurrent = phase.key === currentPhase;

        return (
          <Link
            key={phase.key}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200",
              isActive ? "bg-accent-muted text-accent" : "text-text-secondary hover:text-text-primary hover:bg-card",
              isCurrent && !isActive && "text-accent/60"
            )}
          >
            <phase.icon className="h-4 w-4" />
            <span>{phase.label}</span>
            {isCurrent && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}
