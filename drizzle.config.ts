import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    // Only `migrate`/`studio` need a live database; `generate` works offline.
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
});
