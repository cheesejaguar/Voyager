"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RecapDisplay } from "@/components/trip/recap-display";
import { generateRecapAction } from "@/app/actions/recap";
import { Loader2, BookOpen, FileText, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

type Style = "concise" | "narrative" | "scrapbook";

interface Summary { id: string; style: string | null; content: string | null; }

interface RecapClientProps {
  tripId: string;
  summaries: Summary[];
}

const styles: { value: Style; label: string; icon: typeof FileText }[] = [
  { value: "concise", label: "Concise", icon: FileText },
  { value: "narrative", label: "Narrative", icon: BookOpen },
  { value: "scrapbook", label: "Scrapbook", icon: Camera },
];

export function RecapClient({ tripId, summaries }: RecapClientProps) {
  const [activeStyle, setActiveStyle] = useState<Style>("narrative");
  const [generating, setGenerating] = useState(false);

  const currentSummary = summaries.find((s) => s.style === activeStyle);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateRecapAction(tripId, activeStyle);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {styles.map((s) => (
          <button
            key={s.value}
            onClick={() => setActiveStyle(s.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              activeStyle === s.value
                ? "bg-accent-muted text-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-card"
            )}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {currentSummary?.content ? (
        <RecapDisplay content={currentSummary.content} />
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-text-muted mb-4">
            No {activeStyle} recap generated yet.
          </p>
        </div>
      )}

      <Button onClick={handleGenerate} disabled={generating}>
        {generating ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
        ) : (
          currentSummary?.content ? "Regenerate" : "Generate Recap"
        )}
      </Button>
    </div>
  );
}
