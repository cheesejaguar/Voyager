"use client";

import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/components/photos/upload-dropzone";
import { DayPhotoGroup } from "@/components/photos/day-photo-group";
import { groupPhotosByDay } from "@/lib/utils/photo-association";

interface Photo {
  id: string;
  blobUrl: string;
  filename: string | null;
  associatedDate: string | null;
  associatedItineraryItemId: string | null;
}

interface PhotosClientProps {
  tripId: string;
  initialPhotos: Photo[];
}

export function PhotosClient({ tripId, initialPhotos }: PhotosClientProps) {
  const router = useRouter();

  const grouped = groupPhotosByDay(initialPhotos);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => {
    if (a === "unassigned") return 1;
    if (b === "unassigned") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <UploadDropzone tripId={tripId} onUploadComplete={() => router.refresh()} />
      {sortedDates.map((date) => (
        <DayPhotoGroup
          key={date}
          date={date === "unassigned" ? null : date}
          photos={grouped.get(date)!}
        />
      ))}
    </div>
  );
}
