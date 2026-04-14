import { generateText, streamText, Output } from "ai";
import { gateway } from "ai";
import { models } from "./model-router";
import {
  emailClassificationSchema, flightExtractionSchema, hotelExtractionSchema,
  type EmailClassification,
} from "./schemas";

export async function classifyEmail(emailText: string): Promise<EmailClassification> {
  const { output } = await generateText({
    model: gateway(models.classify),
    output: Output.object({ schema: emailClassificationSchema }),
    prompt: `Classify the following email. Determine if it is a flight booking confirmation, hotel booking confirmation, activity/event booking, or unknown/unrelated content. Return the type and your confidence level.\n\nEmail:\n${emailText}`,
  });
  return output!;
}

export async function extractFlightDetails(emailText: string) {
  return streamText({
    model: gateway(models.extract),
    output: Output.object({ schema: flightExtractionSchema }),
    prompt: `Extract all flight booking details from this confirmation email. Be thorough — extract every segment if there are connections. Use ISO 8601 format with timezone for all dates/times. Use IATA airport codes.\n\nEmail:\n${emailText}`,
  });
}

export async function extractHotelDetails(emailText: string) {
  return streamText({
    model: gateway(models.extract),
    output: Output.object({ schema: hotelExtractionSchema }),
    prompt: `Extract all hotel booking details from this confirmation email. Use ISO 8601 format with timezone for all dates/times. Include the full hotel address.\n\nEmail:\n${emailText}`,
  });
}
