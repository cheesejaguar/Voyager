"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTripAction } from "@/app/actions/trips";

interface CreateTripDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTripDialog({ open, onClose }: CreateTripDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await createTripAction(formData);
    } catch {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Create Trip">
      <form action={handleSubmit}>
        <Input id="title" name="title" label="Trip Name" placeholder="e.g., Florence & Rome 2025" required autoFocus />
        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create Trip"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
