"use client";

import { Image as ImageIcon } from "lucide-react";

interface Photo {
  id: string;
  blobUrl: string;
  filename: string | null;
  associatedDate: string | null;
}

interface PhotoGridProps {
  photos: Photo[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-muted">No photos uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((photo) => (
        <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-surface border border-border">
          <img
            src={photo.blobUrl}
            alt={photo.filename ?? ""}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
