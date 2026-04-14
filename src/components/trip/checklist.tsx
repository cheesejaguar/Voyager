"use client";

import { useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, RefreshCw, Loader2 } from "lucide-react";
import { togglePreTripTaskAction, generatePreTripTasksAction } from "@/app/actions/pre-trip";

interface PreTripTask {
  id: string;
  text: string;
  completed: boolean | null;
  dueDescription: string | null;
}

interface ChecklistProps {
  tripId: string;
  tasks: PreTripTask[];
}

export function Checklist({ tripId, tasks }: ChecklistProps) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generatePreTripTasksAction(tripId);
    } finally {
      setGenerating(false);
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-accent" />
          Pre-Trip Tasks
          {tasks.length > 0 && (
            <span className="text-xs text-text-muted font-normal">
              {completedCount}/{tasks.length}
            </span>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1">{tasks.length === 0 ? "Generate" : "Regenerate"}</span>
        </Button>
      </div>
      <CardContent className="mt-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-text-muted">No tasks yet. Click Generate to create a checklist.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <label key={task.id} className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.completed ?? false}
                  onChange={(e) => togglePreTripTaskAction(task.id, e.target.checked, tripId)}
                  className="rounded border-border accent-accent mt-0.5"
                />
                <div>
                  <span className={task.completed ? "text-text-muted line-through" : "text-text-primary"}>
                    {task.text}
                  </span>
                  {task.dueDescription && (
                    <span className="ml-2 text-xs text-text-muted">{task.dueDescription}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
