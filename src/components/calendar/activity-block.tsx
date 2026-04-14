"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

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
  museum: { bg: "bg-[#5ea0a0]/20", border: "border-[#5ea0a0]", text: "text-[#5ea0a0]" },
  restaurant: { bg: "bg-[#8bb88b]/20", border: "border-[#8bb88b]", text: "text-[#8bb88b]" },
  sightseeing: { bg: "bg-[#d9ab6f]/20", border: "border-[#d9ab6f]", text: "text-[#d9ab6f]" },
  nightlife: { bg: "bg-[#b48cc8]/20", border: "border-[#b48cc8]", text: "text-[#b48cc8]" },
  shopping: { bg: "bg-[#c88b8b]/20", border: "border-[#c88b8b]", text: "text-[#c88b8b]" },
  walking_tour: { bg: "bg-[#5ea0a0]/20", border: "border-[#5ea0a0]", text: "text-[#5ea0a0]" },
  meal: { bg: "bg-[#8bb88b]/20", border: "border-[#8bb88b]", text: "text-[#8bb88b]" },
  activity: { bg: "bg-[#d9ab6f]/20", border: "border-[#d9ab6f]", text: "text-[#d9ab6f]" },
  transit: { bg: "bg-[#4a4a4a]/20", border: "border-[#4a4a4a]", text: "text-[#999999]" },
  default: { bg: "bg-card", border: "border-border", text: "text-text-secondary" },
};

const PIXELS_PER_HOUR = 60;

export function timeToPixels(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 6) * PIXELS_PER_HOUR + (m / 60) * PIXELS_PER_HOUR;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function getCategoryColors(category: string | null, type: string | null) {
  if (category && categoryColors[category]) return categoryColors[category];
  if (type && categoryColors[type]) return categoryColors[type];
  return categoryColors.default;
}

interface ActivityBlockProps {
  item: ItineraryItem;
}

export function ActivityBlock({ item }: ActivityBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  if (!item.startTime || !item.endTime) return null;

  const top = timeToPixels(item.startTime);
  const height = Math.max(30, timeToPixels(item.endTime) - top);
  const colors = getCategoryColors(item.category, item.type);

  return (
    <div
      ref={setNodeRef}
      style={{ top, height, ...style }}
      className={`absolute left-1 right-1 rounded-md border-l-2 px-1.5 py-0.5 overflow-hidden cursor-grab active:cursor-grabbing z-10
        ${colors.bg} ${colors.border} border
        ${isDragging ? "opacity-50 shadow-xl z-50" : ""}
        transition-shadow
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-0.5">
        <GripVertical className="h-3 w-3 shrink-0 text-text-muted mt-0.5" />
        <div className="min-w-0">
          <p className={`text-xs font-medium leading-tight truncate ${colors.text}`}>
            {item.title}
          </p>
          {height > 40 && (
            <p className="text-[10px] text-text-muted leading-tight">
              {formatTime(item.startTime)} – {formatTime(item.endTime)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
