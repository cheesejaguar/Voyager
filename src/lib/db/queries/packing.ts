import { db } from "@/lib/db";
import { packingItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getPackingItems(tripId: string) {
  return db.select().from(packingItems).where(eq(packingItems.tripId, tripId)).orderBy(packingItems.sortOrder);
}

export async function createPackingItems(tripId: string, items: { text: string; category: string }[]) {
  if (items.length === 0) return [];
  const values = items.map((item, i) => ({ tripId, text: item.text, category: item.category, sortOrder: i }));
  return db.insert(packingItems).values(values).returning();
}

export async function togglePackingItem(id: string, checked: boolean) {
  const [item] = await db.update(packingItems).set({ checked }).where(eq(packingItems.id, id)).returning();
  return item;
}

export async function deleteAllPackingItems(tripId: string) {
  await db.delete(packingItems).where(eq(packingItems.tripId, tripId));
}
