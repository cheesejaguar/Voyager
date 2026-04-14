import { generateText, Output } from "ai";
import { gateway } from "ai";
import { z } from "zod";
import { models } from "./model-router";

const preTripTasksSchema = z.object({
  tasks: z.array(z.object({
    text: z.string().describe("Task description"),
    dueDescription: z.string().describe("When to do this relative to departure"),
  })),
});

export async function generatePreTripTasks(context: {
  destinations: string[];
  departureDate: string;
  hasInternationalFlight: boolean;
}) {
  const { output } = await generateText({
    model: gateway(models.packingList),
    output: Output.object({ schema: preTripTasksSchema }),
    prompt: `Generate a pre-trip preparation checklist for a trip to ${context.destinations.join(", ")} departing ${context.departureDate}.\n${context.hasInternationalFlight ? "This is an international trip." : "This is a domestic trip."}\n\nInclude practical tasks like: flight check-in, passport verification, visa requirements, downloading offline maps, packing chargers/adapters, confirming reservations, arranging ground transportation. Prioritize by urgency. Aim for 8-12 tasks.`,
  });
  return output?.tasks ?? [];
}
