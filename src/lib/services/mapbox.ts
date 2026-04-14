interface DirectionsResult {
  durationMinutes: number;
  distanceKm: number;
}

export async function getWalkingDirections(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<DirectionsResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${fromLng},${fromLat};${toLng},${toLat}?access_token=${token}`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) return null;

  return {
    durationMinutes: Math.round(route.duration / 60),
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
  };
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  return {
    lng: feature.center[0],
    lat: feature.center[1],
  };
}
