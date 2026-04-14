"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

export function UpgradeBanner() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-accent-muted border-accent/20">
      <CardContent className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-medium text-accent">Upgrade to Premium</p>
            <p className="text-xs text-text-muted">Unlimited trips, real-time flights, AI-powered recaps</p>
          </div>
        </div>
        <Button size="sm" onClick={handleUpgrade} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upgrade"}
        </Button>
      </CardContent>
    </Card>
  );
}
