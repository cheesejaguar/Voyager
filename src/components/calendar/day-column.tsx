"use client";

import { useDroppable } from "@dnd-kit/core";
import { ActivityBlock } from "@/components/calendar/activity-block";

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

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6AM – 11PM
const PIXELS_PER_HOUR = 60;

function formatDayHeader(dateStr: string): { day: string; date: string } {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
  };
}

interface DayColumnProps {
  date: string;
  items: ItineraryItem[];
  isToday?: boolean;
}

export function DayColumn({ date, items, isToday }: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  const header = formatDayHeader(date);

  return (
    <div className="flex-1 min-w-0 flex flex-col border-r border-border last:border-r-0">
      {/* Day header */}
      <div
        className={`sticky top-0 z-20 flex flex-col items-center py-2 border-b border-border
          ${isToday ? "bg-accent-muted" : "bg-card"}`}
      >
        <span className={`text-[10px] uppercase tracking-widest font-medium ${isToday ? "text-accent" : "text-text-muted"}`}>
          {header.day}
        </span>
        <span className={`text-sm font-semibold ${isToday ? "text-accent" : "text-text-primary"}`}>
          {header.date}
        </span>
      </div>

      {/* Time grid with items */}
      <div
        ref={setNodeRef}
        className={`relative flex-1 transition-colors ${isOver ? "bg-accent/5" : ""}`}
        style={{ minHeight: HOURS.length * PIXELS_PER_HOUR }}
      >
        {/* Hour grid lines */}
        {HOURS.map((h) => (
          <div
            key={h}
            style={{ top: (h - 6) * PIXELS_PER_HOUR, height: PIXELS_PER_HOUR }}
            className="absolute inset-x-0 border-b border-border/20"
          />
        ))}

        {/* Half-hour lines */}
        {HOURS.map((h) => (
          <div
            key={`${h}-half`}
            style={{ top: (h - 6) * PIXELS_PER_HOUR + PIXELS_PER_HOUR / 2 }}
            className="absolute inset-x-0 border-b border-border/10"
          />
        ))}

        {/* Activity blocks */}
        {items.map((item) => (
          <ActivityBlock key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
