"use client";

import { useState } from "react";
import { AgendaView } from "@/components/calendar/agenda-view";
import { WeeklyCalendar } from "@/components/calendar/weekly-calendar";

type ItineraryItem = {
  id: string;
  tripId: string;
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  type: "activity" | "meal" | "transit" | "free_time" | "custom" | null;
  category: string | null;
  locationName: string | null;
  description: string | null;
  notes: string | null;
  transitDurationMin: number | null;
};

type ViewMode = "agenda" | "calendar";

interface ItineraryViewProps {
  tripId: string;
  items: ItineraryItem[];
  startDate: string | null;
  endDate: string | null;
}

export function ItineraryView({ tripId, items, startDate, endDate }: ItineraryViewProps) {
  const [view, setView] = useState<ViewMode>("agenda");

  return (
    <div className="space-y-4">
      {/* View toggle tabs */}
      <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface border border-border p-0.5">
        <button
          onClick={() => setView("agenda")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            view === "agenda"
              ? "bg-card text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Agenda
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            view === "calendar"
              ? "bg-card text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Calendar
        </button>
      </div>

      {/* View content */}
      {view === "agenda" ? (
        <AgendaView
          tripId={tripId}
          items={items}
          startDate={startDate}
          endDate={endDate}
        />
      ) : (
        <WeeklyCalendar
          tripId={tripId}
          items={items}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}
