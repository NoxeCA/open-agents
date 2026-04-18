import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

function getDb(): Db {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Set it in .env.local for local dev or as a Vercel env var in deployments.",
    );
  }
  const client = postgres(url);
  cached = drizzle(client, { schema });
  return cached;
}

// Lazy proxy so importing `db` doesn't crash at build/module-load time when
// DATABASE_URL is unavailable (e.g. Next.js page-data collection).
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const target = getDb() as unknown as Record<string | symbol, unknown>;
    return Reflect.get(target, prop);
  },
});
