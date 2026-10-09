import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { requireServerEnv } from "@/lib/env";

import * as schema from "./schema";

function createDb() {
  return drizzle({
    client: neon(requireServerEnv("DATABASE_URL")),
    schema,
    casing: "snake_case",
  });
}

let cached: ReturnType<typeof createDb> | undefined;

/** Lazily connects so builds and pages that never touch the DB don't need DATABASE_URL. */
export function db() {
  cached ??= createDb();
  return cached;
}

export { schema };
