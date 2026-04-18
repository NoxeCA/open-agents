import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let cached: Db | null = null;

function getDb(): Db {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Set it in .env.local for local dev or as a Vercel env var in deployments.",
    );
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}

// Lazy proxy so importing `db` doesn't crash at build/module-load time when
// DATABASE_URL is unavailable (e.g. Next.js page-data collection).
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const target = getDb() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === "function" ? (value as Function).bind(target) : value;
  },
});
