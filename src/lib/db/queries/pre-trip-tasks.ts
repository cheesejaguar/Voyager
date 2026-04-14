import { db } from "@/lib/db";
import { preTripTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getPreTripTasks(tripId: string) {
  return db.select().from(preTripTasks).where(eq(preTripTasks.tripId, tripId)).orderBy(preTripTasks.sortOrder);
}

export async function createPreTripTasks(tripId: string, tasks: { text: string; dueDescription: string }[]) {
  if (tasks.length === 0) return [];
  const values = tasks.map((task, i) => ({ tripId, text: task.text, dueDescription: task.dueDescription, sortOrder: i }));
  return db.insert(preTripTasks).values(values).returning();
}

export async function togglePreTripTask(id: string, completed: boolean) {
  const [task] = await db.update(preTripTasks).set({ completed }).where(eq(preTripTasks.id, id)).returning();
  return task;
}

export async function deleteAllPreTripTasks(tripId: string) {
  await db.delete(preTripTasks).where(eq(preTripTasks.tripId, tripId));
}
