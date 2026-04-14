interface FoursquarePlace {
  fsqId: string;
  name: string;
  latitude: number;
  longitude: number;
  rating?: number;
  priceLevel?: number;
  photoUrl?: string;
  categories: string[];
}

export async function searchPlaces(
  query: string,
  latitude: number,
  longitude: number,
  radius: number = 2000
): Promise<FoursquarePlace | null> {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    query,
    ll: `${latitude},${longitude}`,
    radius: String(radius),
    limit: "1",
    fields: "fsq_id,name,geocodes,rating,price,photos,categories",
  });

  const response = await fetch(
    `https://api.foursquare.com/v3/places/search?${params}`,
    { headers: { Authorization: apiKey, Accept: "application/json" } }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const place = data.results?.[0];
  if (!place) return null;

  let photoUrl: string | undefined;
  if (place.photos?.length > 0) {
    const photo = place.photos[0];
    photoUrl = `${photo.prefix}300x200${photo.suffix}`;
  }

  return {
    fsqId: place.fsq_id,
    name: place.name,
    latitude: place.geocodes?.main?.latitude ?? latitude,
    longitude: place.geocodes?.main?.longitude ?? longitude,
    rating: place.rating ? place.rating / 2 : undefined, // Foursquare uses 0-10, normalize to 0-5
    priceLevel: place.price,
    photoUrl,
    categories: place.categories?.map((c: { name: string }) => c.name) ?? [],
  };
}
