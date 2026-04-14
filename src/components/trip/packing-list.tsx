"use client";

import { useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Luggage, RefreshCw, Loader2 } from "lucide-react";
import { togglePackingItemAction, generatePackingListAction } from "@/app/actions/pre-trip";

interface PackingItem {
  id: string;
  text: string;
  category: string | null;
  checked: boolean | null;
}

interface PackingListProps {
  tripId: string;
  items: PackingItem[];
}

const categoryOrder = ["clothing", "tech", "toiletries", "documents", "accessories", "misc"];

export function PackingList({ tripId, items }: PackingListProps) {
  const [generating, setGenerating] = useState(false);

  const groupedItems = categoryOrder.reduce((acc, cat) => {
    const catItems = items.filter((item) => item.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, PackingItem[]>);

  // Items without a matching category
  const uncategorized = items.filter((item) => !item.category || !categoryOrder.includes(item.category));
  if (uncategorized.length > 0) groupedItems["misc"] = [...(groupedItems["misc"] ?? []), ...uncategorized];

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generatePackingListAction(tripId);
    } finally {
      setGenerating(false);
    }
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Luggage className="h-4 w-4 text-accent" />
          Packing List
          {items.length > 0 && (
            <span className="text-xs text-text-muted font-normal">
              {checkedCount}/{items.length}
            </span>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1">{items.length === 0 ? "Generate" : "Regenerate"}</span>
        </Button>
      </div>
      <CardContent className="mt-3">
        {items.length === 0 ? (
          <p className="text-sm text-text-muted">No packing list yet. Click Generate to create one.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category}>
                <h4 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2 capitalize">{category}</h4>
                <div className="space-y-1">
                  {catItems.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={item.checked ?? false}
                        onChange={(e) => togglePackingItemAction(item.id, e.target.checked, tripId)}
                        className="rounded border-border accent-accent"
                      />
                      <span className={item.checked ? "text-text-muted line-through" : "text-text-primary"}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
