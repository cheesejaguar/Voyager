"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById, updateTripDates } from "@/lib/db/queries/trips";
import { createImportDocument, updateImportStatus } from "@/lib/db/queries/imports";
import { createFlightSegments, checkDuplicateFlight, getFlightsForTrip } from "@/lib/db/queries/flights";
import { createHotelStay, checkDuplicateHotel, getHotelsForTrip } from "@/lib/db/queries/hotels";
import { computeTripDates, inferFlightDirection, computeDestinations } from "@/lib/utils/scaffold";
import type { FlightExtraction, HotelExtraction } from "@/lib/ai/schemas";

export async function confirmFlightBooking(
  tripId: string, emailText: string, extraction: FlightExtraction, confidence: number
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");

  const isDuplicate = await checkDuplicateFlight(tripId, extraction.confirmationCode);
  if (isDuplicate) return { success: false, error: "This flight has already been added." };

  const importDoc = await createImportDocument({
    tripId, rawText: emailText, sourceType: "flight", parsedJson: extraction, confidence,
  });

  const directions = inferFlightDirection(
    extraction.segments.map((s) => ({ departureTime: new Date(s.departureTime) }))
  );

  const connectionGroup = `flight-${importDoc.id}`;
  await createFlightSegments(tripId, importDoc.id, extraction.segments.map((s, i) => ({
    airline: extraction.airline, flightNumber: extraction.flightNumber,
    confirmationCode: extraction.confirmationCode, passengerNames: extraction.passengerNames,
    departureAirport: s.departureAirport, arrivalAirport: s.arrivalAirport,
    departureTime: s.departureTime, arrivalTime: s.arrivalTime,
    terminal: s.terminal, gate: s.gate, cabinClass: s.cabinClass, seat: s.seat,
    direction: directions[i], sortOrder: i, connectionGroup,
  })));

  await updateImportStatus(importDoc.id, "confirmed");
  await updateTripScaffold(tripId);
  revalidatePath(`/trip/${tripId}`);
  return { success: true };
}

export async function confirmHotelBooking(
  tripId: string, emailText: string, extraction: HotelExtraction, confidence: number
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");
  const trip = await getTripById(tripId, user.id);
  if (!trip) throw new Error("Trip not found");

  const isDuplicate = await checkDuplicateHotel(tripId, extraction.confirmationNumber);
  if (isDuplicate) return { success: false, error: "This hotel has already been added." };

  const importDoc = await createImportDocument({
    tripId, rawText: emailText, sourceType: "hotel", parsedJson: extraction, confidence,
  });

  await createHotelStay(tripId, importDoc.id, extraction);
  await updateImportStatus(importDoc.id, "confirmed");
  await updateTripScaffold(tripId);
  revalidatePath(`/trip/${tripId}`);
  return { success: true };
}

async function updateTripScaffold(tripId: string) {
  const flights = await getFlightsForTrip(tripId);
  const hotels = await getHotelsForTrip(tripId);

  const flightDates = flights
    .filter((f) => f.departureTime && f.arrivalTime)
    .map((f) => ({ departureTime: f.departureTime!, arrivalTime: f.arrivalTime! }));

  const hotelDates = hotels
    .filter((h) => h.checkIn && h.checkOut)
    .map((h) => ({ checkIn: h.checkIn!, checkOut: h.checkOut! }));

  const { startDate, endDate } = computeTripDates(flightDates, hotelDates);

  if (startDate && endDate) {
    const flightAirports = flights
      .filter((f) => f.departureAirport && f.arrivalAirport)
      .map((f) => ({ departureAirport: f.departureAirport!, arrivalAirport: f.arrivalAirport! }));
    const homeAirport = flights[0]?.departureAirport ?? "";
    const destinations = computeDestinations(flightAirports, homeAirport);
    await updateTripDates(tripId, startDate, endDate, destinations);
  }
}
