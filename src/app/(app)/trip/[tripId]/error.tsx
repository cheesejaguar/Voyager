"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function TripError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Trip error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-error mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Trip Error</h2>
        <p className="text-sm text-text-secondary mb-6">
          We couldn&apos;t load this trip. It may have been deleted or you may not have access.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="secondary">Retry</Button>
          <Link href="/dashboard">
            <Button>Back to Trips</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
