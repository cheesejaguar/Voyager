"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgendaItem } from "@/components/calendar/agenda-item";
import { addItineraryItemAction } from "@/app/actions/itinerary";

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

interface AgendaViewProps {
  tripId: string;
  items: ItineraryItem[];
  startDate: string | null;
  endDate: string | null;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6AM to 11PM

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
}

function clampDate(date: string, start: string | null, end: string | null): string {
  if (start && date < start) return start;
  if (end && date > end) return end;
  return date;
}

function getDefaultDate(startDate: string | null, endDate: string | null): string {
  const today = new Date().toISOString().slice(0, 10);
  if (!startDate) return today;
  if (today >= startDate && (!endDate || today <= endDate)) return today;
  return startDate;
}

interface AddItemFormProps {
  tripId: string;
  date: string;
  onDone: () => void;
}

function AddItemForm({ tripId, date, onDone }: AddItemFormProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [type, setType] = useState<"activity" | "meal" | "transit" | "free_time" | "custom">("activity");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setSubmitting(true);
    try {
      await addItineraryItemAction({ tripId, date, startTime, endTime, type, title: title.trim() });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-1 rounded-lg border border-border bg-card p-3 space-y-2"
    >
      <Input
        label="Activity title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Visit the Louvre"
        error={error}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">Start</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">End</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="activity">Activity</option>
          <option value="meal">Meal</option>
          <option value="transit">Transit</option>
          <option value="free_time">Free Time</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Adding…</> : "Add Activity"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function AgendaView({ tripId, items, startDate, endDate }: AgendaViewProps) {
  const [currentDate, setCurrentDate] = useState(() => getDefaultDate(startDate, endDate));
  const [showAddForm, setShowAddForm] = useState(false);

  const dayItems = items
    .filter((item) => item.date === currentDate)
    .sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });

  function goToDay(delta: number) {
    const next = addDays(currentDate, delta);
    const clamped = clampDate(next, startDate, endDate);
    setCurrentDate(clamped);
    setShowAddForm(false);
  }

  const canGoPrev = !startDate || currentDate > startDate;
  const canGoNext = !endDate || currentDate < endDate;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Day selector */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToDay(-1)}
          disabled={!canGoPrev}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-text-primary">
          {formatDisplayDate(currentDate)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToDay(1)}
          disabled={!canGoNext}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline */}
      <div className="flex min-h-[400px]">
        {/* Hour rail */}
        <div className="w-16 shrink-0 border-r border-border">
          {HOURS.map((h) => (
            <div key={h} className="relative h-[60px] border-b border-border/40">
              <span className="absolute -top-2.5 left-2 text-[10px] text-text-muted leading-none">
                {formatHour(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-3">
          {dayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <p className="text-sm text-text-muted">
                No activities planned. Add something or check recommendations.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Activity
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {dayItems.map((item, idx) => (
                <div key={item.id} className="group">
                  {/* Transit indicator before item */}
                  {item.transitDurationMin && item.transitDurationMin > 0 && (
                    <div className="flex items-center gap-1.5 py-1 px-2 text-xs text-text-muted">
                      <div className="h-px flex-1 bg-border" />
                      <span>{item.transitDurationMin} min walk</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <AgendaItem item={item} tripId={tripId} />
                  {/* Add button between items */}
                  {idx < dayItems.length - 1 && !showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center gap-1.5 py-1 opacity-0 group-hover:opacity-100 hover:!opacity-100 focus:!opacity-100 transition-opacity text-xs text-text-muted hover:text-accent"
                    >
                      <div className="h-px flex-1 bg-border" />
                      <Plus className="h-3 w-3" />
                      <div className="h-px flex-1 bg-border" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add form or add button at bottom */}
              {showAddForm ? (
                <AddItemForm
                  tripId={tripId}
                  date={currentDate}
                  onDone={() => setShowAddForm(false)}
                />
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 w-full flex items-center gap-1.5 py-1.5 rounded-lg border border-dashed border-border hover:border-accent/50 hover:text-accent text-xs text-text-muted transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mx-auto" />
                  <span>Add activity</span>
                </button>
              )}
            </div>
          )}

          {dayItems.length === 0 && showAddForm && (
            <AddItemForm
              tripId={tripId}
              date={currentDate}
              onDone={() => setShowAddForm(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
