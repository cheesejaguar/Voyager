"use client";

import { useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Loader2 } from "lucide-react";
import { updateTripPreferencesAction } from "@/app/actions/preferences";
import { preferenceLabels, defaultPreferences, type TravelPreferences } from "@/types/preferences";

interface PreferencePanelProps {
  tripId: string;
  currentPreferences: Partial<TravelPreferences>;
}

export function PreferencePanel({ tripId, currentPreferences }: PreferencePanelProps) {
  const [prefs, setPrefs] = useState<Partial<TravelPreferences>>(currentPreferences);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateTripPreferencesAction(tripId, prefs);
    } finally {
      setSaving(false);
    }
  }

  const merged = { ...defaultPreferences, ...prefs };

  return (
    <Card>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-accent" />
          Trip Preferences
        </CardTitle>
        <span className="text-xs text-text-muted">{expanded ? "Collapse" : "Expand"}</span>
      </div>
      {expanded && (
        <CardContent className="mt-3">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(preferenceLabels) as Array<keyof TravelPreferences>).map((key) => {
              const config = preferenceLabels[key];
              return (
                <div key={key}>
                  <label className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1 block">
                    {config.label}
                  </label>
                  <select
                    value={merged[key]}
                    onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-lg bg-surface border border-border px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    {config.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Saving</> : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
