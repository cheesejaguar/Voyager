# Voyager API Reference

All API routes are under `src/app/api/`. Authentication is handled by Clerk middleware -- most endpoints require a valid session.

---

## POST /api/parse

Parse a booking confirmation email using AI.

**Auth:** Required (Clerk session)

**Request Body:**
```json
{
  "emailText": "string - raw email text to parse",
  "tripId": "string - UUID of the trip to associate with"
}
```

**Response (unknown email):**
```json
{
  "classification": { "type": "unknown", "confidence": 0.3 },
  "extraction": null,
  "message": "Could not identify this as a booking confirmation."
}
```

**Response (flight/hotel):**
Streaming response (`text/plain`) with structured JSON. Classification metadata in headers:
- `x-classification-type`: `"flight"` or `"hotel"`
- `x-classification-confidence`: `"0.95"`
- `x-trip-id`: the trip ID

The stream body contains the extracted structured data as it's generated.

**Flight extraction shape:**
```json
{
  "airline": "United Airlines",
  "flightNumber": "UA 1234",
  "confirmationCode": "ABC123",
  "passengerNames": ["John Doe"],
  "segments": [
    {
      "departureAirport": "SFO",
      "arrivalAirport": "JFK",
      "departureTime": "2025-06-01T10:00:00-07:00",
      "arrivalTime": "2025-06-01T18:30:00-04:00",
      "terminal": "T3",
      "gate": "B12",
      "cabinClass": "Economy",
      "seat": "24A"
    }
  ]
}
```

**Hotel extraction shape:**
```json
{
  "hotelName": "Grand Hotel Florence",
  "address": "Via del Corso 1, Florence, Italy",
  "confirmationNumber": "HTL-9876",
  "checkIn": "2025-06-01T15:00:00+02:00",
  "checkOut": "2025-06-05T11:00:00+02:00",
  "roomType": "Deluxe Double",
  "guestCount": 2
}
```

---

## POST /api/recommend

Generate AI recommendations for a specific day.

**Auth:** Required

**Request Body:**
```json
{
  "tripId": "string - trip UUID",
  "date": "string - ISO date (YYYY-MM-DD)",
  "anchorLat": "number - hotel latitude (optional)",
  "anchorLng": "number - hotel longitude (optional)"
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "name": "Uffizi Gallery",
      "category": "museum",
      "description": "World-renowned art museum housing Renaissance masterpieces.",
      "rationale": "12-min walk from your hotel, fits your culture focus",
      "estimatedDurationMin": 180,
      "distanceFromAnchor": "12-min walk",
      "latitude": 43.7677,
      "longitude": 11.2553,
      "rating": 4.7,
      "priceLevel": 2,
      "foursquareId": "4b058...",
      "photoUrl": "https://...",
      "status": "suggested"
    }
  ]
}
```

---

## GET /api/directions

Get walking directions between two points (Mapbox proxy).

**Auth:** Required

**Query Parameters:**
- `fromLat` - departure latitude
- `fromLng` - departure longitude
- `toLat` - destination latitude
- `toLng` - destination longitude

**Response:**
```json
{
  "durationMinutes": 12,
  "distanceKm": 0.9
}
```

---

## POST /api/photos/upload

Upload a photo to Vercel Blob storage.

**Auth:** Required

**Request:** `multipart/form-data`
- `file` - image file
- `tripId` - trip UUID
- `takenAt` - ISO timestamp (optional, from EXIF)
- `gpsLatitude` - latitude (optional, from EXIF)
- `gpsLongitude` - longitude (optional, from EXIF)
- `associatedDate` - ISO date (optional)

**Response:**
```json
{
  "photo": {
    "id": "uuid",
    "blobUrl": "https://...",
    "filename": "IMG_1234.jpg",
    "takenAt": "2025-06-03T14:30:00Z",
    "gpsLatitude": 43.7696,
    "gpsLongitude": 11.2558,
    "associatedDate": "2025-06-03"
  }
}
```

---

## POST /api/stripe/checkout

Create a Stripe Checkout session for premium upgrade.

**Auth:** Required

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

---

## POST /api/stripe/webhook

Stripe webhook handler. Processes subscription lifecycle events.

**Auth:** Stripe signature verification (not Clerk)

**Events handled:**
- `checkout.session.completed` -- creates subscription, upgrades user
- `customer.subscription.updated` -- syncs status changes
- `customer.subscription.deleted` -- downgrades user to free

---

## POST /api/clerk/webhook

Clerk user sync webhook.

**Auth:** Svix signature verification (not Clerk session)

**Events handled:**
- `user.created` -- creates internal user record
- `user.updated` -- syncs email/name/avatar
- `user.deleted` -- deletes user (cascades to all data)

---

## Server Actions

These are called directly from React components via `"use server"` functions. Not HTTP endpoints.

### Trip Actions (`src/app/actions/trips.ts`)
- `createTripAction(formData)` -- create trip + owner membership
- `updateTripAction(tripId, formData)` -- update trip title
- `deleteTripAction(tripId)` -- delete trip (owner only)

### Booking Actions (`src/app/actions/bookings.ts`)
- `confirmFlightBooking(tripId, emailText, extraction, confidence)` -- save flight + scaffold
- `confirmHotelBooking(tripId, emailText, extraction, confidence)` -- save hotel + scaffold

### Itinerary Actions (`src/app/actions/itinerary.ts`)
- `addItineraryItemAction(data)` -- add activity/meal/transit
- `updateItineraryItemAction(tripId, itemId, data)` -- edit item
- `deleteItineraryItemAction(tripId, itemId)` -- remove item
- `moveItineraryItemAction(tripId, itemId, newDate, newStartTime, newEndTime)` -- drag-and-drop

### Pre-Trip Actions (`src/app/actions/pre-trip.ts`)
- `generatePackingListAction(tripId)` -- AI packing list generation
- `togglePackingItemAction(itemId, checked, tripId)` -- check/uncheck item
- `generatePreTripTasksAction(tripId)` -- AI task generation
- `togglePreTripTaskAction(taskId, completed, tripId)` -- check/uncheck task

### Recommendation Actions (`src/app/actions/recommendations.ts`)
- `addRecommendationToItinerary(tripId, recId, data)` -- add rec as itinerary item
- `saveRecommendationAction(tripId, recId)` -- bookmark for later
- `dismissRecommendationAction(tripId, recId)` -- dismiss suggestion

### Recap Actions (`src/app/actions/recap.ts`)
- `generateRecapAction(tripId, style)` -- generate trip recap

### Preference Actions (`src/app/actions/preferences.ts`)
- `updateTripPreferencesAction(tripId, preferences)` -- save trip preferences

### Member Actions (`src/app/actions/members.ts`)
- `inviteMemberAction(tripId, email)` -- invite user to trip
- `removeMemberAction(tripId, memberId)` -- remove member (owner only)
- `acceptInvitationAction(tripId)` -- accept invitation
