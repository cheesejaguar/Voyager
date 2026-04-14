import { generateText, Output } from "ai";
import { gateway } from "ai";
import { z } from "zod";
import { models } from "./model-router";

const packingListSchema = z.object({
  items: z.array(z.object({
    text: z.string().describe("Item to pack"),
    category: z.enum(["clothing", "tech", "toiletries", "documents", "accessories", "misc"]).describe("Packing category"),
  })),
});

export async function generatePackingList(context: {
  destinations: string[];
  durationDays: number;
  weather: { avgHigh: number; avgLow: number; rainyDays: number };
}) {
  const { output } = await generateText({
    model: gateway(models.packingList),
    output: Output.object({ schema: packingListSchema }),
    prompt: `Generate a practical packing list for a ${context.durationDays}-day trip to ${context.destinations.join(", ")}.\n\nWeather: Average high ${context.weather.avgHigh}°F, low ${context.weather.avgLow}°F, ${context.weather.rainyDays} rainy days expected.\n\nInclude essentials for clothing, tech (chargers, adapters), toiletries, documents (passport, copies), and accessories. Be practical, not excessive. Aim for 20-35 items total.`,
  });
  return output?.items ?? [];
}
