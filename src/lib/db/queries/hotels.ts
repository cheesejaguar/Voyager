import { db } from "@/lib/db";
import { hotelStays } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function createHotelStay(
  tripId: string,
  importDocumentId: string,
  data: {
    hotelName: string; address: string; confirmationNumber: string;
    checkIn: string; checkOut: string; roomType?: string;
    guestCount?: number; contactInfo?: string;
  }
) {
  const [stay] = await db.insert(hotelStays).values({
    tripId, importDocumentId, hotelName: data.hotelName, address: data.address,
    confirmationNumber: data.confirmationNumber,
    checkIn: new Date(data.checkIn), checkOut: new Date(data.checkOut),
    roomType: data.roomType ?? null, guestCount: data.guestCount ?? null,
    contactInfo: data.contactInfo ?? null,
  }).returning();
  return stay;
}

export async function getHotelsForTrip(tripId: string) {
  return db.select().from(hotelStays).where(eq(hotelStays.tripId, tripId));
}

export async function checkDuplicateHotel(tripId: string, confirmationNumber: string) {
  const results = await db.select().from(hotelStays)
    .where(and(eq(hotelStays.tripId, tripId), eq(hotelStays.confirmationNumber, confirmationNumber)))
    .limit(1);
  return results.length > 0;
}
