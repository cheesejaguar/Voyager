"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";

interface UploadDropzoneProps {
  tripId: string;
  onUploadComplete: () => void;
}

export function UploadDropzone({ tripId, onUploadComplete }: UploadDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setUploading(true);
    setProgress({ current: 0, total: imageFiles.length });

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setProgress({ current: i + 1, total: imageFiles.length });

      // Extract EXIF
      let takenAt: string | undefined;
      let gpsLatitude: number | undefined;
      let gpsLongitude: number | undefined;
      let associatedDate: string | undefined;

      try {
        const exifr = await import("exifr");
        const exif = await exifr.parse(file, ["DateTimeOriginal", "latitude", "longitude"]);
        if (exif?.DateTimeOriginal) {
          const d = new Date(exif.DateTimeOriginal);
          takenAt = d.toISOString();
          associatedDate = d.toISOString().split("T")[0];
        }
        if (exif?.latitude) gpsLatitude = exif.latitude;
        if (exif?.longitude) gpsLongitude = exif.longitude;
      } catch {
        // EXIF extraction failed — continue without metadata
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("tripId", tripId);
      if (takenAt) formData.append("takenAt", takenAt);
      if (gpsLatitude !== undefined) formData.append("gpsLatitude", String(gpsLatitude));
      if (gpsLongitude !== undefined) formData.append("gpsLongitude", String(gpsLongitude));
      if (associatedDate) formData.append("associatedDate", associatedDate);

      await fetch("/api/photos/upload", { method: "POST", body: formData });
    }

    setUploading(false);
    onUploadComplete();
  }, [tripId, onUploadComplete]);

  return (
    <Card
      className={`border-2 border-dashed transition-colors cursor-pointer ${
        dragOver ? "border-accent bg-accent-muted" : "border-border hover:border-text-muted"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <CardContent className="py-8 text-center">
        <input ref={inputRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-text-secondary">
              Uploading {progress.current} of {progress.total}...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">Drop photos here or click to browse</p>
            <p className="text-xs text-text-muted">EXIF data (date, GPS) will be extracted automatically</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
