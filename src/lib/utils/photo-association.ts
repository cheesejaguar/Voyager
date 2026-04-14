interface PhotoWithMeta {
  id: string;
  takenAt: Date | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  associatedDate: string | null;
}

interface ItineraryItemWithLocation {
  id: string;
  date: string;
  startTime: string | null;
  title: string;
  latitude: number | null;
  longitude: number | null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestItineraryItem(
  photo: PhotoWithMeta,
  items: ItineraryItemWithLocation[]
): string | null {
  // Match by GPS if available
  if (photo.gpsLatitude && photo.gpsLongitude) {
    const itemsWithCoords = items.filter((i) => i.latitude && i.longitude);
    if (itemsWithCoords.length === 0) return null;

    let nearest = itemsWithCoords[0];
    let minDist = haversineDistance(photo.gpsLatitude, photo.gpsLongitude, nearest.latitude!, nearest.longitude!);

    for (const item of itemsWithCoords.slice(1)) {
      const dist = haversineDistance(photo.gpsLatitude, photo.gpsLongitude, item.latitude!, item.longitude!);
      if (dist < minDist) { minDist = dist; nearest = item; }
    }

    // Only match if within 1km
    if (minDist <= 1) return nearest.id;
  }

  // Match by timestamp if available
  if (photo.takenAt && photo.associatedDate) {
    const dayItems = items.filter((i) => i.date === photo.associatedDate);
    if (dayItems.length > 0) return dayItems[0].id;
  }

  return null;
}

export function groupPhotosByDay(
  photos: { id: string; blobUrl: string; filename: string | null; associatedDate: string | null; associatedItineraryItemId: string | null }[]
): Map<string, typeof photos> {
  const groups = new Map<string, typeof photos>();

  for (const photo of photos) {
    const key = photo.associatedDate ?? "unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(photo);
  }

  return groups;
}
