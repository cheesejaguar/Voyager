"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTripDialog } from "@/components/trip/create-trip-dialog";

export function DashboardActions() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <Button onClick={() => setShowCreate(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Trip
      </Button>
      <CreateTripDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
