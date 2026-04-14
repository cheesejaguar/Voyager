"use client";

import { useState } from "react";
import { Loader2, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "./recommendation-card";

type Recommendation = {
  id: string;
  tripId: string;
  name: string;
  category: string | null;
  description: string | null;
  rationale: string | null;
  estimatedDurationMin: number | null;
  distanceFromAnchor: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  priceLevel: number | null;
  photoUrl: string | null;
  status: "suggested" | "saved" | "added" | "dismissed" | null;
  targetDate: string | null;
};

interface RecommendationListProps {
  tripId: string;
  recommendations: Recommendation[];
  startDate: string | null;
  endDate: string | null;
  anchorLat?: number;
  anchorLng?: number;
}

function buildDateRange(start: string | null, end: string | null): string[] {
  if (!start || !end) return [];
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function RecommendationList({
  tripId,
  recommendations: initialRecs,
  startDate,
  endDate,
  anchorLat,
  anchorLng,
}: RecommendationListProps) {
  const [recs, setRecs] = useState<Recommendation[]>(initialRecs);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    startDate ?? ""
  );

  const availableDates = buildDateRange(startDate, endDate);
  const visibleRecs = recs.filter(
    (r) => r.status !== "dismissed" && r.status !== "added"
  );

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        tripId,
        date: selectedDate || startDate,
      };
      if (anchorLat != null) body.anchorLat = anchorLat;
      if (anchorLng != null) body.anchorLng = anchorLng;

      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to generate recommendations");
      }

      const json = await res.json();
      const newRecs: Recommendation[] = json.recommendations ?? [];
      // Merge: keep recs from other days, replace recs for this date
      setRecs((prev) => [
        ...prev.filter(
          (r) => r.targetDate !== (selectedDate || startDate)
        ),
        ...newRecs,
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        {availableDates.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
            >
              <option value="">All days</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating}
          variant="primary"
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? "Generating..." : "Generate Recommendations"}
        </Button>

        {anchorLat != null && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <MapPin className="h-3 w-3" />
            Near your hotel
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* List */}
      {visibleRecs.length === 0 && !generating ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Sparkles className="mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">
            No recommendations yet
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Click &quot;Generate Recommendations&quot; to get personalized suggestions
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              tripId={tripId}
              availableDates={availableDates}
            />
          ))}
        </div>
      )}

      {generating && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      )}
    </div>
  );
}
