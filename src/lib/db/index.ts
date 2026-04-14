import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

// Lazily initialized to avoid build-time errors when DATABASE_URL is absent
let _db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// Convenience proxy so callers can still do `import { db } from "@/lib/db"`
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof createDb>];
  },
});
