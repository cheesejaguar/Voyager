"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Luggage, PlaneTakeoff, CalendarDays, PlaneLanding, Camera, Sparkles, Map } from "lucide-react";
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
  { key: "recommendations", label: "Discover", icon: Sparkles, path: "recommendations" },
  { key: "map", label: "Map", icon: Map, path: "map" },
  { key: "return_flight", label: "Return", icon: PlaneLanding, path: "flight/return" },
  { key: "post_trip", label: "Post-Trip", icon: Camera, path: "photos" },
] as const;

export function PhaseRail({ tripId, currentPhase }: PhaseRailProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row overflow-x-auto gap-1 py-3 px-2 border-b border-border md:flex-col md:overflow-x-visible md:gap-1 md:w-48 md:py-4 md:pr-4 md:border-b-0 md:border-r">
      {phases.map((phase) => {
        const href = `/trip/${tripId}/${phase.path}`;
        const isActive = pathname.startsWith(href);
        const isCurrent = phase.key === currentPhase;

        return (
          <Link
            key={phase.key}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs whitespace-nowrap transition-colors duration-200 md:gap-3 md:px-3 md:py-2 md:text-sm md:whitespace-normal",
              isActive ? "bg-accent-muted text-accent" : "text-text-secondary hover:text-text-primary hover:bg-card",
              isCurrent && !isActive && "text-accent/60"
            )}
          >
            <phase.icon className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
            <span>{phase.label}</span>
            {isCurrent && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}
