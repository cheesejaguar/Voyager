import { generateText, Output } from "ai";
import { gateway } from "ai";
import { z } from "zod";
import { models } from "./model-router";

const recapSchema = z.object({
  content: z.string().describe("The trip recap in markdown format"),
});

export async function generateRecap(context: {
  destinations: string[];
  startDate: string;
  endDate: string;
  itinerary: { date: string; title: string; category: string | null }[];
  photoCount: number;
  style: "concise" | "narrative" | "scrapbook";
  isPremium: boolean;
}) {
  const styleInstructions = {
    concise: "Write a concise bullet-point summary of the trip highlights. Keep it under 300 words.",
    narrative: "Write a journal-style narrative recap, day by day. Use vivid descriptions and personal tone. 500-800 words.",
    scrapbook: "Write short, evocative captions for each day/activity, suitable for pairing with photos. 2-3 sentences per item.",
  };

  const itineraryStr = context.itinerary.map(
    (i) => `${i.date}: ${i.title}${i.category ? ` (${i.category})` : ""}`
  ).join("\n");

  const model = context.isPremium ? models.recapPremium : models.recap;

  const { output } = await generateText({
    model: gateway(model),
    output: Output.object({ schema: recapSchema }),
    prompt: `Generate a trip recap for a journey to ${context.destinations.join(", ")} from ${context.startDate} to ${context.endDate}.

Style: ${styleInstructions[context.style]}

Itinerary:
${itineraryStr || "No specific activities recorded."}

${context.photoCount > 0 ? `The traveler took ${context.photoCount} photos during the trip.` : ""}

Write the recap in markdown format. Make it feel personal and warm — this is a memory the traveler wants to keep.`,
  });

  return output?.content ?? "Unable to generate recap. Please try again.";
}
