"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, Plus, Bookmark, Star, Loader2, X } from "lucide-react";
import {
  addRecommendationToItinerary,
  saveRecommendationAction,
  dismissRecommendationAction,
} from "@/app/actions/recommendations";

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

interface RecommendationCardProps {
  recommendation: Recommendation;
  tripId: string;
  availableDates: string[]; // YYYY-MM-DD strings
}

const CATEGORY_COLORS: Record<string, string> = {
  sightseeing: "#d9ab6f",
  landmark: "#d9ab6f",
  restaurant: "#8bb88b",
  cafe: "#8bb88b",
  food: "#8bb88b",
  museum: "#5ea0a0",
  culture: "#5ea0a0",
  nightlife: "#b48cc8",
  shopping: "#c88b8b",
};

function getCategoryColor(category: string | null): string {
  if (!category) return "#999999";
  const lower = category.toLowerCase();
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#999999";
}

function formatCategory(category: string | null): string {
  if (!category) return "Other";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

function renderStars(rating: number) {
  const full = Math.round(rating);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3 w-3"
          fill={i < full ? "currentColor" : "none"}
          style={{ color: i < full ? "#d9ab6f" : "#444" }}
        />
      ))}
      <span className="ml-1 text-xs text-text-secondary">{rating.toFixed(1)}</span>
    </span>
  );
}

function renderPriceLevel(level: number) {
  return (
    <span className="text-xs" style={{ color: "#8bb88b" }}>
      {"$".repeat(level)}
      <span style={{ color: "#333" }}>{"$".repeat(Math.max(0, 4 - level))}</span>
    </span>
  );
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function RecommendationCard({
  recommendation: rec,
  tripId,
  availableDates,
}: RecommendationCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    rec.targetDate ?? availableDates[0] ?? ""
  );
  const [startTime, setStartTime] = useState("10:00");
  const [saving, setSaving] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [status, setStatus] = useState(rec.status ?? "suggested");

  const catColor = getCategoryColor(rec.category);
  const duration = rec.estimatedDurationMin ?? 60;

  async function handleAdd() {
    setSaving(true);
    try {
      const endTime = addMinutes(startTime, duration);
      await addRecommendationToItinerary(tripId, rec.id, {
        date: selectedDate,
        startTime,
        endTime,
        name: rec.name,
        category: rec.category ?? "activity",
        description: rec.description ?? "",
        locationName: rec.name,
        latitude: rec.latitude ?? undefined,
        longitude: rec.longitude ?? undefined,
      });
      setStatus("added");
      setShowAddForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setBookmarking(true);
    try {
      await saveRecommendationAction(tripId, rec.id);
      setStatus("saved");
    } catch (e) {
      console.error(e);
    } finally {
      setBookmarking(false);
    }
  }

  async function handleDismiss() {
    try {
      await dismissRecommendationAction(tripId, rec.id);
      setStatus("dismissed");
    } catch (e) {
      console.error(e);
    }
  }

  if (status === "dismissed") return null;

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:border-border/60">
      {/* Status ribbon */}
      {status === "added" && (
        <div
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ backgroundColor: "#8bb88b" }}
        />
      )}
      {status === "saved" && (
        <div
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ backgroundColor: "#d9ab6f" }}
        />
      )}

      <CardContent className="p-0">
        {/* Photo + header row */}
        <div className="flex gap-3 p-4">
          {/* Photo thumbnail */}
          {rec.photoUrl ? (
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <img
                src={rec.photoUrl}
                alt={rec.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg text-2xl"
              style={{ backgroundColor: catColor + "22" }}
            >
              <span style={{ color: catColor }}>
                {rec.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Main info */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-text-primary leading-tight">
                {rec.name}
              </h3>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Category badge */}
            <Badge
              className="text-xs"
              style={{
                backgroundColor: catColor + "22",
                color: catColor,
                border: "none",
              }}
            >
              {formatCategory(rec.category)}
            </Badge>

            {/* Description */}
            {rec.description && (
              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                {rec.description}
              </p>
            )}

            {/* Rationale */}
            {rec.rationale && (
              <p className="text-xs font-medium" style={{ color: "#d9ab6f" }}>
                {rec.rationale}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              {rec.estimatedDurationMin && (
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="h-3 w-3" />
                  {rec.estimatedDurationMin >= 60
                    ? `${Math.round(rec.estimatedDurationMin / 60)}h`
                    : `${rec.estimatedDurationMin}m`}
                </span>
              )}
              {rec.distanceFromAnchor && (
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <MapPin className="h-3 w-3" />
                  {rec.distanceFromAnchor}
                </span>
              )}
              {rec.rating != null && renderStars(rec.rating)}
              {rec.priceLevel != null && renderPriceLevel(rec.priceLevel)}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
          {status === "added" ? (
            <span className="text-xs font-medium" style={{ color: "#8bb88b" }}>
              Added to itinerary
            </span>
          ) : (
            <>
              <Button
                size="sm"
                variant="primary"
                className="flex-1 gap-1.5"
                onClick={() => setShowAddForm((v) => !v)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add to Itinerary
              </Button>
              <Button
                size="sm"
                variant={status === "saved" ? "secondary" : "ghost"}
                className="gap-1.5"
                onClick={handleSave}
                disabled={bookmarking || status === "saved"}
              >
                {bookmarking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bookmark
                    className="h-3.5 w-3.5"
                    fill={status === "saved" ? "currentColor" : "none"}
                  />
                )}
                {status === "saved" ? "Saved" : "Save"}
              </Button>
            </>
          )}
        </div>

        {/* Inline add form */}
        {showAddForm && status !== "added" && (
          <div className="border-t border-border bg-surface/50 px-4 py-3 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Schedule this activity
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                  Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
                >
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
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                className="flex-1 gap-1.5"
                onClick={handleAdd}
                disabled={saving || !selectedDate}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {saving ? "Adding..." : "Confirm"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
