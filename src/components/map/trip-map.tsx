"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type HotelMarker = {
  type: "hotel";
  lat: number;
  lng: number;
  name: string;
};

type ItineraryMarker = {
  type: "itinerary";
  lat: number;
  lng: number;
  name: string;
  category: string | null;
};

type RecommendationMarker = {
  type: "recommendation";
  lat: number;
  lng: number;
  name: string;
  category: string | null;
  id: string;
};

type AnyMarker = HotelMarker | ItineraryMarker | RecommendationMarker;

interface TripMapProps {
  hotelMarkers: HotelMarker[];
  itineraryMarkers: ItineraryMarker[];
  recommendationMarkers: RecommendationMarker[];
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

function createMarkerEl(color: string, size: number, pulse = false): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color};
    border: 2.5px solid rgba(255,255,255,0.8);
    box-shadow: 0 0 0 ${pulse ? "4px" : "0px"} ${color}55, 0 2px 8px rgba(0,0,0,0.6);
    cursor: pointer;
    transition: transform 0.15s ease;
  `;
  el.onmouseenter = () => { el.style.transform = "scale(1.25)"; };
  el.onmouseleave = () => { el.style.transform = "scale(1)"; };
  return el;
}

export function TripMap({
  hotelMarkers,
  itineraryMarkers,
  recommendationMarkers,
}: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!containerRef.current || !token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 2,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    mapRef.current = map;

    const allMarkers: mapboxgl.Marker[] = [];
    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;

    function addMarker(
      m: AnyMarker,
      el: HTMLElement,
      popupHtml: string
    ) {
      const popup = new mapboxgl.Popup({
        offset: 14,
        closeButton: true,
        className: "voyager-popup",
      }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .setPopup(popup)
        .addTo(map);

      allMarkers.push(marker);
      bounds.extend([m.lng, m.lat]);
      hasPoints = true;
    }

    // Hotel markers (amber, larger)
    for (const h of hotelMarkers) {
      const el = createMarkerEl("#d9ab6f", 18, true);
      const html = `
        <div style="font-family:sans-serif;padding:4px 2px;min-width:140px">
          <div style="font-weight:700;font-size:13px;color:#e8e0d4;margin-bottom:2px">${h.name}</div>
          <div style="font-size:11px;color:#d9ab6f;font-weight:500">Your Hotel</div>
        </div>`;
      addMarker(h, el, html);
    }

    // Itinerary markers (category colored, medium)
    for (const item of itineraryMarkers) {
      const color = getCategoryColor(item.category);
      const el = createMarkerEl(color, 14, false);
      const html = `
        <div style="font-family:sans-serif;padding:4px 2px;min-width:140px">
          <div style="font-weight:700;font-size:13px;color:#e8e0d4;margin-bottom:2px">${item.name}</div>
          ${item.category ? `<div style="font-size:11px;color:${color};font-weight:500;text-transform:capitalize">${item.category}</div>` : ""}
          <div style="font-size:11px;color:#999;margin-top:2px">Itinerary item</div>
        </div>`;
      addMarker(item, el, html);
    }

    // Recommendation markers (smaller, category colored but muted)
    for (const rec of recommendationMarkers) {
      const color = getCategoryColor(rec.category);
      const el = createMarkerEl(color + "bb", 11, false);
      el.style.border = `2px dashed ${color}`;
      el.style.background = color + "44";
      const html = `
        <div style="font-family:sans-serif;padding:4px 2px;min-width:160px">
          <div style="font-weight:700;font-size:13px;color:#e8e0d4;margin-bottom:2px">${rec.name}</div>
          ${rec.category ? `<div style="font-size:11px;color:${color};font-weight:500;text-transform:capitalize;margin-bottom:4px">${rec.category}</div>` : ""}
          <div style="font-size:11px;color:#999">Suggested place</div>
        </div>`;
      addMarker(rec, el, html);
    }

    // Fit bounds once map is loaded
    map.on("load", () => {
      if (hasPoints) {
        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          maxZoom: 14,
          duration: 800,
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface text-center px-6">
        <div className="text-3xl">🗺️</div>
        <p className="text-sm font-medium text-text-secondary">
          Mapbox token not configured
        </p>
        <p className="text-xs text-text-muted max-w-xs">
          Set <code className="rounded bg-card px-1 py-0.5 font-mono text-accent">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment to enable the map view.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "400px" }}
    />
  );
}
