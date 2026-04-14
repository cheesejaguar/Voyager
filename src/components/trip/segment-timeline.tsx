import { Badge } from "@/components/ui/badge";
import { differenceInMinutes, format } from "date-fns";

interface Segment {
  departureAirport: string | null;
  arrivalAirport: string | null;
  departureTime: Date | null;
  arrivalTime: Date | null;
}

interface SegmentTimelineProps {
  segments: Segment[];
}

export function SegmentTimeline({ segments }: SegmentTimelineProps) {
  if (segments.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-4">
      {segments.map((seg, i) => {
        const nextSeg = segments[i + 1];
        const connectionMin = nextSeg?.departureTime && seg.arrivalTime
          ? differenceInMinutes(nextSeg.departureTime, seg.arrivalTime)
          : null;
        const isTightConnection = connectionMin !== null && connectionMin < 90;
        const isLongLayover = connectionMin !== null && connectionMin > 180;

        return (
          <div key={i} className="flex items-center gap-2">
            {/* Segment block */}
            <div className="flex items-center gap-1 rounded-lg bg-surface px-3 py-2 text-sm whitespace-nowrap">
              <span className="font-medium">{seg.departureAirport}</span>
              {seg.departureTime && (
                <span className="text-text-muted text-xs">{format(seg.departureTime, "HH:mm")}</span>
              )}
              <span className="text-text-muted mx-1">→</span>
              <span className="font-medium">{seg.arrivalAirport}</span>
              {seg.arrivalTime && (
                <span className="text-text-muted text-xs">{format(seg.arrivalTime, "HH:mm")}</span>
              )}
            </div>

            {/* Connection indicator */}
            {connectionMin !== null && (
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 border-t border-dashed border-border" />
                <Badge variant={isTightConnection ? "error" : isLongLayover ? "warning" : "default"} className="text-[10px] whitespace-nowrap">
                  {Math.floor(connectionMin / 60)}h {connectionMin % 60}m
                </Badge>
                {isTightConnection && (
                  <span className="text-[10px] text-error">Tight!</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
