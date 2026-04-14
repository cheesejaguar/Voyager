"use client";

import { useState } from "react";
import { Trash2, MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteItineraryItemAction } from "@/app/actions/itinerary";

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

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  museum: { bg: "bg-[#5ea0a0]/10", border: "border-[#5ea0a0]", text: "text-[#5ea0a0]" },
  restaurant: { bg: "bg-[#8bb88b]/10", border: "border-[#8bb88b]", text: "text-[#8bb88b]" },
  sightseeing: { bg: "bg-[#d9ab6f]/10", border: "border-[#d9ab6f]", text: "text-[#d9ab6f]" },
  nightlife: { bg: "bg-[#b48cc8]/10", border: "border-[#b48cc8]", text: "text-[#b48cc8]" },
  shopping: { bg: "bg-[#c88b8b]/10", border: "border-[#c88b8b]", text: "text-[#c88b8b]" },
  walking_tour: { bg: "bg-[#5ea0a0]/10", border: "border-[#5ea0a0]", text: "text-[#5ea0a0]" },
  meal: { bg: "bg-[#8bb88b]/10", border: "border-[#8bb88b]", text: "text-[#8bb88b]" },
  activity: { bg: "bg-[#d9ab6f]/10", border: "border-[#d9ab6f]", text: "text-[#d9ab6f]" },
  transit: { bg: "bg-[#4a4a4a]/10", border: "border-[#4a4a4a]", text: "text-[#999999]" },
  default: { bg: "bg-surface", border: "border-border", text: "text-text-secondary" },
};

function getCategoryColors(category: string | null, type: string | null) {
  if (category && categoryColors[category]) return categoryColors[category];
  if (type && categoryColors[type]) return categoryColors[type];
  return categoryColors.default;
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function getDurationMinutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

interface AgendaItemProps {
  item: ItineraryItem;
  tripId: string;
}

export function AgendaItem({ item, tripId }: AgendaItemProps) {
  const [deleting, setDeleting] = useState(false);
  const colors = getCategoryColors(item.category, item.type);
  const duration = getDurationMinutes(item.startTime, item.endTime);

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteItineraryItemAction(tripId, item.id);
    } catch {
      setDeleting(false);
    }
  }

  const categoryLabel = item.category ?? item.type ?? "activity";

  return (
    <div
      className={`relative flex gap-3 rounded-lg border-l-2 p-3 ${colors.bg} ${colors.border} border border-l-2`}
    >
      {/* Category border accent */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
            {(item.startTime || item.endTime) && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                <Clock className="h-3 w-3 shrink-0" />
                {item.startTime && formatTime(item.startTime)}
                {item.startTime && item.endTime && (
                  <ArrowRight className="h-3 w-3" />
                )}
                {item.endTime && formatTime(item.endTime)}
                {duration !== null && duration > 0 && (
                  <span className="ml-1 text-text-muted">({duration} min)</span>
                )}
              </div>
            )}
            {item.locationName && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{item.locationName}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium capitalize ${colors.bg} ${colors.text}`}
            >
              {categoryLabel.replace(/_/g, " ")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:!opacity-100 text-text-muted hover:text-error"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
