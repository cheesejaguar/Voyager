import { describe, it, expect } from "vitest";
import { computePhase } from "@/lib/utils/trip-phases";
import type { TripWithFlights } from "@/types/trip";

describe("computePhase", () => {
  const makeTrip = (flights: TripWithFlights["flights"]): TripWithFlights => ({ flights });

  const outbound = (dep: string, arr: string) => ({
    direction: "outbound" as const,
    departureTime: new Date(dep),
    arrivalTime: new Date(arr),
  });

  const returnFlight = (dep: string, arr: string) => ({
    direction: "return" as const,
    departureTime: new Date(dep),
    arrivalTime: new Date(arr),
  });

  it("returns pre_trip when no flights exist", () => {
    expect(computePhase(makeTrip([]), new Date())).toBe("pre_trip");
  });

  it("returns pre_trip before outbound departure", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-05-28T12:00:00Z"))).toBe("pre_trip");
  });

  it("returns outbound_flight during outbound travel", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-01T12:00:00Z"))).toBe("outbound_flight");
  });

  it("returns trip after outbound arrival and before return departure", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-04T12:00:00Z"))).toBe("trip");
  });

  it("returns return_flight during return travel", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-08T18:00:00Z"))).toBe("return_flight");
  });

  it("returns post_trip after return arrival", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-09T12:00:00Z"))).toBe("post_trip");
  });

  it("handles multi-segment outbound (uses last arrival)", () => {
    const trip = makeTrip([
      outbound("2025-06-01T08:00:00Z", "2025-06-01T11:00:00Z"),
      outbound("2025-06-01T13:00:00Z", "2025-06-01T18:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-01T15:00:00Z"))).toBe("outbound_flight");
  });

  it("returns trip when only outbound flights exist (no return)", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-04T12:00:00Z"))).toBe("trip");
  });
});
