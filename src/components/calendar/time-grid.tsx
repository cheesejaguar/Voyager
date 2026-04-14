const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6AM to 11PM

const PIXELS_PER_HOUR = 60;

function formatHour(h: number): string {
  if (h === 12) return "12 PM";
  if (h === 0 || h === 24) return "12 AM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export function TimeGrid() {
  return (
    <div className="w-14 shrink-0 border-r border-border select-none">
      {HOURS.map((h) => (
        <div
          key={h}
          style={{ height: PIXELS_PER_HOUR }}
          className="relative border-b border-border/30"
        >
          <span className="absolute -top-2.5 left-1 text-[10px] text-text-muted leading-none whitespace-nowrap">
            {formatHour(h)}
          </span>
        </div>
      ))}
    </div>
  );
}
