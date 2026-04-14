import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface DayPhotoGroupProps {
  date: string | null;
  photos: { id: string; blobUrl: string; filename: string | null }[];
}

export function DayPhotoGroup({ date, photos }: DayPhotoGroupProps) {
  return (
    <Card>
      <CardTitle className="text-base">
        {date ? format(new Date(date + "T00:00:00"), "EEEE, MMM d") : "Unassigned"}
      </CardTitle>
      <CardContent className="mt-3">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-surface border border-border">
              <img src={photo.blobUrl} alt={photo.filename ?? ""} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
