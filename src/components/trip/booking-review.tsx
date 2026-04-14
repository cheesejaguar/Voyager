"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlightReviewCard } from "./flight-review-card";
import { HotelReviewCard } from "./hotel-review-card";
import { confirmFlightBooking, confirmHotelBooking } from "@/app/actions/bookings";
import type { FlightExtraction, HotelExtraction } from "@/lib/ai/schemas";

interface BookingReviewProps {
  tripId: string;
  emailText: string;
  type: "flight" | "hotel";
  data: FlightExtraction | HotelExtraction;
  confidence: number;
  onConfirmed: () => void;
  onDismiss: () => void;
}

export function BookingReview({ tripId, emailText, type, data, confidence, onConfirmed, onDismiss }: BookingReviewProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      const result = type === "flight"
        ? await confirmFlightBooking(tripId, emailText, data as FlightExtraction, confidence)
        : await confirmHotelBooking(tripId, emailText, data as HotelExtraction, confidence);

      if (result.success) {
        onConfirmed();
      } else {
        setError(result.error ?? "Failed to save booking.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {type === "flight" ? (
        <FlightReviewCard data={data as FlightExtraction} />
      ) : (
        <HotelReviewCard data={data as HotelExtraction} />
      )}
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={handleConfirm} disabled={pending}>
          {pending ? "Saving..." : "Confirm & Add"}
        </Button>
        <Button variant="ghost" onClick={onDismiss} disabled={pending}>Dismiss</Button>
      </div>
    </div>
  );
}
