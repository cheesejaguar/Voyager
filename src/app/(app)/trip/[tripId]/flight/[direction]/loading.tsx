import { Skeleton } from "@/components/ui/skeleton";

export default function FlightLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
