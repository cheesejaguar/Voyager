import { describe, it, expect } from "vitest";
import { emailClassificationSchema, flightExtractionSchema, hotelExtractionSchema } from "@/lib/ai/schemas";

describe("emailClassificationSchema", () => {
  it("validates a flight classification", () => {
    const result = emailClassificationSchema.safeParse({ type: "flight", confidence: 0.95 });
    expect(result.success).toBe(true);
  });
  it("rejects invalid type", () => {
    const result = emailClassificationSchema.safeParse({ type: "car_rental", confidence: 0.9 });
    expect(result.success).toBe(false);
  });
  it("rejects confidence outside 0..1", () => {
    expect(emailClassificationSchema.safeParse({ type: "hotel", confidence: 1.5 }).success).toBe(false);
    expect(emailClassificationSchema.safeParse({ type: "hotel", confidence: -0.1 }).success).toBe(false);
  });
});

describe("flightExtractionSchema", () => {
  it("validates a complete flight extraction", () => {
    const result = flightExtractionSchema.safeParse({
      airline: "United Airlines", flightNumber: "UA 1234", confirmationCode: "ABC123",
      passengerNames: ["John Doe"],
      segments: [{ departureAirport: "SFO", arrivalAirport: "JFK", departureTime: "2025-06-01T10:00:00-07:00", arrivalTime: "2025-06-01T18:30:00-04:00" }],
    });
    expect(result.success).toBe(true);
  });
  it("validates with optional fields", () => {
    const result = flightExtractionSchema.safeParse({
      airline: "Delta", flightNumber: "DL 500", confirmationCode: "XYZ789",
      passengerNames: ["Jane Smith"],
      segments: [{ departureAirport: "LAX", arrivalAirport: "ATL", departureTime: "2025-07-15T08:00:00-07:00", arrivalTime: "2025-07-15T15:00:00-04:00", terminal: "T4", gate: "B12", cabinClass: "Economy", seat: "24A" }],
    });
    expect(result.success).toBe(true);
    expect(result.data?.segments[0]).toMatchObject({ terminal: "T4", gate: "B12", cabinClass: "Economy", seat: "24A" });
  });
  it("rejects a segment missing a required airport", () => {
    const result = flightExtractionSchema.safeParse({
      airline: "Delta", flightNumber: "DL 500", confirmationCode: "XYZ789",
      passengerNames: ["Jane Smith"],
      segments: [{ departureAirport: "LAX", departureTime: "2025-07-15T08:00:00-07:00", arrivalTime: "2025-07-15T15:00:00-04:00" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("hotelExtractionSchema", () => {
  it("validates a complete hotel extraction", () => {
    const result = hotelExtractionSchema.safeParse({
      hotelName: "Grand Hotel Florence", address: "Via del Corso 1, Florence, Italy",
      confirmationNumber: "HTL-9876", checkIn: "2025-06-01T15:00:00+02:00", checkOut: "2025-06-05T11:00:00+02:00",
    });
    expect(result.success).toBe(true);
  });
  it("rejects a hotel missing check-out", () => {
    const result = hotelExtractionSchema.safeParse({
      hotelName: "Grand Hotel Florence", address: "Via del Corso 1, Florence, Italy",
      confirmationNumber: "HTL-9876", checkIn: "2025-06-01T15:00:00+02:00",
    });
    expect(result.success).toBe(false);
  });
  it("rejects a non-numeric guest count", () => {
    const result = hotelExtractionSchema.safeParse({
      hotelName: "Grand Hotel Florence", address: "Via del Corso 1, Florence, Italy",
      confirmationNumber: "HTL-9876", checkIn: "2025-06-01T15:00:00+02:00", checkOut: "2025-06-05T11:00:00+02:00",
      guestCount: "two",
    });
    expect(result.success).toBe(false);
  });
});
