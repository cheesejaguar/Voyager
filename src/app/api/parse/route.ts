import { auth } from "@clerk/nextjs/server";
import { classifyEmail, extractFlightDetails, extractHotelDetails } from "@/lib/ai/parse-email";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { emailText, tripId } = await req.json();

  if (!emailText || typeof emailText !== "string") {
    return Response.json({ error: "emailText is required" }, { status: 400 });
  }
  if (!tripId || typeof tripId !== "string") {
    return Response.json({ error: "tripId is required" }, { status: 400 });
  }

  // Step 1: Classify
  const classification = await classifyEmail(emailText);

  if (classification.type === "unknown") {
    return Response.json({
      classification,
      extraction: null,
      message: "Could not identify this as a booking confirmation.",
    });
  }

  // Step 2: Extract based on type
  if (classification.type === "flight") {
    const result = await extractFlightDetails(emailText);
    return result.toTextStreamResponse({
      headers: {
        "x-classification-type": "flight",
        "x-classification-confidence": String(classification.confidence),
        "x-trip-id": tripId,
      },
    });
  }

  if (classification.type === "hotel") {
    const result = await extractHotelDetails(emailText);
    return result.toTextStreamResponse({
      headers: {
        "x-classification-type": "hotel",
        "x-classification-confidence": String(classification.confidence),
        "x-trip-id": tripId,
      },
    });
  }

  return Response.json({
    classification,
    extraction: null,
    message: "Activity extraction is not yet supported.",
  });
}
