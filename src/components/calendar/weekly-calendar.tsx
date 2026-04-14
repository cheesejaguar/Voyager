"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeGrid } from "@/components/calendar/time-grid";
import { DayColumn } from "@/components/calendar/day-column";
import { ActivityBlock } from "@/components/calendar/activity-block";
import { moveItineraryItemAction } from "@/app/actions/itinerary";

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

const PIXELS_PER_HOUR = 60;

export function timeToPixels(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 6) * PIXELS_PER_HOUR + (m / 60) * PIXELS_PER_HOUR;
}

function pixelsToTime(px: number): string {
  const totalMinutes = Math.round((px / PIXELS_PER_HOUR) * 60) + 6 * 60;
  const snapped = Math.round(totalMinutes / 15) * 15;
  const h = Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function getWeekStart(dateStr: string): string {
  // Return Monday of the week containing dateStr
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDefaultWeekStart(startDate: string | null): string {
  const today = new Date().toISOString().slice(0, 10);
  const anchor = startDate ?? today;
  return getWeekStart(anchor);
}

interface WeeklyCalendarProps {
  tripId: string;
  items: ItineraryItem[];
  startDate: string | null;
  endDate: string | null;
}

export function WeeklyCalendar({ tripId, items, startDate, endDate }: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getDefaultWeekStart(startDate));
  const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const today = new Date().toISOString().slice(0, 10);

  // Generate 7 days for this week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function goToWeek(delta: number) {
    setWeekStart((prev) => addDays(prev, delta * 7));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event;
    setActiveItem(null);

    if (!over) return;

    const item = active.data.current?.item as ItineraryItem | undefined;
    if (!item) return;

    const newDate = over.id as string;

    // Calculate new start time by adding the vertical delta to the original pixel position
    const originalTop = item.startTime ? timeToPixels(item.startTime) : 0;
    const newTop = Math.max(0, originalTop + delta.y);
    const newStartTime = pixelsToTime(newTop);

    // Calculate duration to preserve it
    let newEndTime = newStartTime;
    if (item.startTime && item.endTime) {
      const [sh, sm] = item.startTime.split(":").map(Number);
      const [eh, em] = item.endTime.split(":").map(Number);
      const durationMin = (eh * 60 + em) - (sh * 60 + sm);
      const [nsh, nsm] = newStartTime.split(":").map(Number);
      const endTotalMin = nsh * 60 + nsm + durationMin;
      const endH = Math.floor(endTotalMin / 60);
      const endM = endTotalMin % 60;
      newEndTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    }

    // Only update if something changed
    if (newDate === item.date && newStartTime === item.startTime && newEndTime === item.endTime) return;

    try {
      await moveItineraryItemAction(tripId, item.id, newDate, newStartTime, newEndTime);
    } catch (err) {
      console.error("Failed to move item:", err);
    }
  }

  const weekLabel = `Week of ${formatWeekLabel(weekStart)}`;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Week navigation */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => goToWeek(-1)} aria-label="Previous week">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-text-primary">{weekLabel}</span>
        <Button variant="ghost" size="sm" onClick={() => goToWeek(1)} aria-label="Next week">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <DndContext
            sensors={sensors}
            onDragStart={(e) => {
              const item = e.active.data.current?.item as ItineraryItem | undefined;
              setActiveItem(item ?? null);
            }}
            onDragEnd={handleDragEnd}
          >
            <div className="flex">
              {/* Time labels column — no header, aligns with day grid */}
              <div className="flex flex-col">
                {/* Header spacer matching day column headers */}
                <div className="h-[52px] w-14 shrink-0 border-b border-border border-r border-r-border" />
                <TimeGrid />
              </div>

              {/* Day columns */}
              {weekDays.map((date) => {
                const dayItems = items.filter((item) => item.date === date);
                return (
                  <DayColumn
                    key={date}
                    date={date}
                    items={dayItems}
                    isToday={date === today}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeItem && <ActivityBlock item={activeItem} />}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
