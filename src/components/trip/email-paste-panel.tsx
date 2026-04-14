"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { BookingReview } from "./booking-review";
import { Mail, Loader2 } from "lucide-react";
import type { FlightExtraction, HotelExtraction } from "@/lib/ai/schemas";

type ParseState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "classified"; type: string }
  | { status: "extracted"; type: "flight" | "hotel"; data: FlightExtraction | HotelExtraction; confidence: number }
  | { status: "error"; message: string }
  | { status: "confirmed" };

interface EmailPastePanelProps {
  tripId: string;
}

export function EmailPastePanel({ tripId }: EmailPastePanelProps) {
  const [emailText, setEmailText] = useState("");
  const [state, setState] = useState<ParseState>({ status: "idle" });

  const handleParse = useCallback(async () => {
    if (!emailText.trim()) return;
    setState({ status: "parsing" });

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText, tripId }),
      });

      if (!response.ok) {
        const err = await response.json();
        setState({ status: "error", message: err.error || "Parse failed" });
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("text/plain") || contentType.includes("text/event-stream")) {
        const classificationType = response.headers.get("x-classification-type") as "flight" | "hotel";
        const confidence = parseFloat(response.headers.get("x-classification-confidence") ?? "0.8");

        setState({ status: "classified", type: classificationType });

        const text = await response.text();

        try {
          const lines = text.split("\n").filter((l) => l.trim());
          let parsed: FlightExtraction | HotelExtraction | null = null;

          for (let i = lines.length - 1; i >= 0; i--) {
            try { parsed = JSON.parse(lines[i]); break; } catch { continue; }
          }
          if (!parsed) parsed = JSON.parse(text);

          setState({ status: "extracted", type: classificationType, data: parsed!, confidence });
        } catch {
          setState({ status: "error", message: "Failed to parse extraction results. Please try again." });
        }
      } else {
        const json = await response.json();
        if (json.classification?.type === "unknown") {
          setState({ status: "error", message: "This doesn't appear to be a booking confirmation email." });
        } else {
          setState({ status: "error", message: json.message || "Unsupported email type." });
        }
      }
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }, [emailText, tripId]);

  function handleReset() {
    setEmailText("");
    setState({ status: "idle" });
  }

  if (state.status === "extracted") {
    return (
      <BookingReview
        tripId={tripId} emailText={emailText} type={state.type}
        data={state.data} confidence={state.confidence}
        onConfirmed={() => { setState({ status: "confirmed" }); setTimeout(handleReset, 2000); }}
        onDismiss={handleReset}
      />
    );
  }

  if (state.status === "confirmed") {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-success font-medium">Booking added successfully!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-accent" />
        Import Booking
      </CardTitle>
      <CardContent className="mt-3">
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder="Paste your flight or hotel confirmation email here..."
          className="w-full h-40 rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
          disabled={state.status === "parsing" || state.status === "classified"}
        />
        {state.status === "error" && <p className="mt-2 text-sm text-error">{state.message}</p>}
        {(state.status === "parsing" || state.status === "classified") && (
          <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
            <Loader2 className="h-4 w-4 animate-spin" />
            {state.status === "parsing" ? "Classifying email..." : `Extracting ${state.type} details...`}
          </div>
        )}
        <div className="mt-3 flex gap-3">
          <Button onClick={handleParse} disabled={!emailText.trim() || state.status === "parsing" || state.status === "classified"}>
            {state.status === "parsing" || state.status === "classified" ? "Processing..." : "Extract Booking"}
          </Button>
          {state.status === "error" && <Button variant="ghost" onClick={handleReset}>Clear</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
