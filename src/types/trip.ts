export type TripPhase =
  | "pre_trip"
  | "outbound_flight"
  | "trip"
  | "return_flight"
  | "post_trip";

export type TripStatus = "planning" | "active" | "completed" | "archived";
export type FlightDirection = "outbound" | "return";

export interface FlightSegmentData {
  direction: FlightDirection;
  departureTime: Date;
  arrivalTime: Date;
}

export interface TripWithFlights {
  flights: FlightSegmentData[];
}
