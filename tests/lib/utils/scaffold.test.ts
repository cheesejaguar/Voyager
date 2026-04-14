import { describe, it, expect } from "vitest";
import { computeTripDates, inferFlightDirection, computeDestinations } from "@/lib/utils/scaffold";

describe("computeTripDates", () => {
  it("computes dates from flights and hotels", () => {
    const flights = [
      { departureTime: new Date("2025-06-01T10:00:00Z"), arrivalTime: new Date("2025-06-01T18:00:00Z") },
      { departureTime: new Date("2025-06-08T16:00:00Z"), arrivalTime: new Date("2025-06-08T22:00:00Z") },
    ];
    const hotels = [
      { checkIn: new Date("2025-06-01T15:00:00Z"), checkOut: new Date("2025-06-08T11:00:00Z") },
    ];
    const { startDate, endDate } = computeTripDates(flights, hotels);
    expect(startDate).toBe("2025-06-01");
    expect(endDate).toBe("2025-06-08");
  });

  it("handles flights only", () => {
    const flights = [{ departureTime: new Date("2025-06-01T10:00:00Z"), arrivalTime: new Date("2025-06-01T18:00:00Z") }];
    const { startDate, endDate } = computeTripDates(flights, []);
    expect(startDate).toBe("2025-06-01");
    expect(endDate).toBe("2025-06-01");
  });

  it("handles hotels only", () => {
    const hotels = [{ checkIn: new Date("2025-06-02T15:00:00Z"), checkOut: new Date("2025-06-05T11:00:00Z") }];
    const { startDate, endDate } = computeTripDates([], hotels);
    expect(startDate).toBe("2025-06-02");
    expect(endDate).toBe("2025-06-05");
  });

  it("returns nulls when no bookings", () => {
    const { startDate, endDate } = computeTripDates([], []);
    expect(startDate).toBeNull();
    expect(endDate).toBeNull();
  });
});

describe("inferFlightDirection", () => {
  it("marks first half as outbound and second half as return", () => {
    const segments = [
      { departureTime: new Date("2025-06-01T10:00:00Z") },
      { departureTime: new Date("2025-06-01T14:00:00Z") },
      { departureTime: new Date("2025-06-08T16:00:00Z") },
      { departureTime: new Date("2025-06-08T20:00:00Z") },
    ];
    expect(inferFlightDirection(segments)).toEqual(["outbound", "outbound", "return", "return"]);
  });

  it("marks single segment as outbound", () => {
    const segments = [{ departureTime: new Date("2025-06-01T10:00:00Z") }];
    expect(inferFlightDirection(segments)).toEqual(["outbound"]);
  });

  it("marks odd number correctly (more outbound)", () => {
    const segments = [
      { departureTime: new Date("2025-06-01T10:00:00Z") },
      { departureTime: new Date("2025-06-04T10:00:00Z") },
      { departureTime: new Date("2025-06-08T16:00:00Z") },
    ];
    expect(inferFlightDirection(segments)).toEqual(["outbound", "outbound", "return"]);
  });
});

describe("computeDestinations", () => {
  it("extracts unique destination cities from flights", () => {
    const flights = [
      { departureAirport: "SFO", arrivalAirport: "FCO" },
      { departureAirport: "FCO", arrivalAirport: "SFO" },
    ];
    expect(computeDestinations(flights, "SFO")).toEqual(["FCO"]);
  });

  it("handles multi-city trips", () => {
    const flights = [
      { departureAirport: "SFO", arrivalAirport: "FCO" },
      { departureAirport: "FCO", arrivalAirport: "CDG" },
      { departureAirport: "CDG", arrivalAirport: "SFO" },
    ];
    expect(computeDestinations(flights, "SFO")).toEqual(["FCO", "CDG"]);
  });

  it("returns empty for no flights", () => {
    expect(computeDestinations([], "SFO")).toEqual([]);
  });
});
