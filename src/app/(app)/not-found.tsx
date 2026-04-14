import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        <Compass className="h-12 w-12 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-sm text-text-secondary mb-6">
          Looks like you&apos;ve wandered off the map. Let&apos;s get you back on track.
        </p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
