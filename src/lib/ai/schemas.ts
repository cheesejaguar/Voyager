import { z } from "zod";

export const emailClassificationSchema = z.object({
  type: z.enum(["flight", "hotel", "activity", "unknown"]).describe("The type of booking confirmation email"),
  confidence: z.number().min(0).max(1).describe("Confidence score from 0.0 to 1.0"),
});
export type EmailClassification = z.infer<typeof emailClassificationSchema>;

export const flightSegmentSchema = z.object({
  departureAirport: z.string().describe("IATA airport code for departure (e.g., SFO, JFK)"),
  arrivalAirport: z.string().describe("IATA airport code for arrival (e.g., LAX, LHR)"),
  departureTime: z.string().describe("Departure date/time in ISO 8601 format with timezone"),
  arrivalTime: z.string().describe("Arrival date/time in ISO 8601 format with timezone"),
  terminal: z.string().optional().describe("Departure terminal if mentioned"),
  gate: z.string().optional().describe("Departure gate if mentioned"),
  cabinClass: z.string().optional().describe("Cabin class (Economy, Business, First)"),
  seat: z.string().optional().describe("Seat assignment if mentioned"),
});

export const flightExtractionSchema = z.object({
  airline: z.string().describe("Full airline name"),
  flightNumber: z.string().describe("Flight number including airline code"),
  confirmationCode: z.string().describe("Booking confirmation or record locator code"),
  passengerNames: z.array(z.string()).describe("List of passenger names on the booking"),
  segments: z.array(flightSegmentSchema).describe("Individual flight segments (legs) in order"),
});
export type FlightExtraction = z.infer<typeof flightExtractionSchema>;

export const hotelExtractionSchema = z.object({
  hotelName: z.string().describe("Full hotel or property name"),
  address: z.string().describe("Full address of the hotel"),
  confirmationNumber: z.string().describe("Hotel booking confirmation number"),
  checkIn: z.string().describe("Check-in date/time in ISO 8601 format with timezone"),
  checkOut: z.string().describe("Check-out date/time in ISO 8601 format with timezone"),
  roomType: z.string().optional().describe("Room type if mentioned"),
  guestCount: z.number().optional().describe("Number of guests if mentioned"),
  contactInfo: z.string().optional().describe("Hotel contact info (phone/email) if mentioned"),
});
export type HotelExtraction = z.infer<typeof hotelExtractionSchema>;
