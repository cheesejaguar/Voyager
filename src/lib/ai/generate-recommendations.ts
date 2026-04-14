import { generateText, Output } from "ai";
import { gateway } from "ai";
import { z } from "zod";
import { models } from "./model-router";
import type { TravelPreferences } from "@/types/preferences";

const recommendationSchema = z.object({
  recommendations: z.array(z.object({
    name: z.string().describe("Place or activity name"),
    category: z.string().describe("Category: restaurant, museum, park, nightlife, shopping, cafe, walking_tour, landmark"),
    description: z.string().describe("1-2 sentence description"),
    rationale: z.string().describe("Why this fits the traveler's plan and preferences"),
    estimatedDurationMin: z.number().describe("Estimated time to spend in minutes"),
  })),
});

export async function generateRecommendations(context: {
  destination: string;
  date: string;
  preferences: Partial<TravelPreferences>;
  existingItems: string[];
  timeGaps: string[];
}) {
  const prefStr = Object.entries(context.preferences)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const { output } = await generateText({
    model: gateway(models.recommend),
    output: Output.object({ schema: recommendationSchema }),
    prompt: `Suggest 8 activities/places for a traveler in ${context.destination} on ${context.date}.

Preferences: ${prefStr || "balanced, mixed interests"}

Already planned: ${context.existingItems.length > 0 ? context.existingItems.join(", ") : "nothing yet"}

Available time gaps: ${context.timeGaps.length > 0 ? context.timeGaps.join(", ") : "full day open"}

Provide diverse suggestions across categories. Each should include why it fits this traveler's preferences and schedule. Avoid suggesting things already in their itinerary.`,
  });

  return output?.recommendations ?? [];
}
