import { getWalkingDirections } from "@/lib/services/mapbox";

export async function calculateTransitTime(
  fromLat: number | null, fromLng: number | null,
  toLat: number | null, toLng: number | null
): Promise<number | null> {
  if (!fromLat || !fromLng || !toLat || !toLng) return null;

  const result = await getWalkingDirections(fromLat, fromLng, toLat, toLng);
  return result?.durationMinutes ?? null;
}

export function formatTransitDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min walk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m walk` : `${h}h walk`;
}
