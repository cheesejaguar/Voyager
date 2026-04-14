import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-[600px] rounded-xl" />
    </div>
  );
}
