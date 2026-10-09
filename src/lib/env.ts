import "server-only";

import { z } from "zod";

/**
 * Server-side environment. Every integration is optional at boot so the app builds and the
 * landing page works before each service is connected; code that needs a value calls
 * `requireServerEnv`, which fails loudly with the variable's name.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url().optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  /** 32 random bytes, base64. Encrypts PII columns. */
  ENCRYPTION_KEY: z.string().min(40).optional(),
  /** Vercel Blob (OIDC on Vercel; token only for local/off-platform use). */
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  USAJOBS_API_KEY: z.string().min(1).optional(),
  USAJOBS_EMAIL: z.email().optional(),
  ADZUNA_APP_ID: z.string().min(1).optional(),
  ADZUNA_APP_KEY: z.string().min(1).optional(),
  /** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
  CRON_SECRET: z.string().min(16).optional(),
  /** Hard ceiling on AI spend per calendar month, in USD. */
  AI_MONTHLY_BUDGET_USD: z.coerce.number().positive().default(40),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class MissingEnvError extends Error {
  constructor(public readonly key: string) {
    super(`Missing environment variable ${key}. Add it in Vercel, then run \`vercel env pull\`.`);
    this.name = "MissingEnvError";
  }
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  // Treat empty strings as unset so a blank line in .env doesn't fail URL validation.
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ""),
  );
  return serverEnvSchema.parse(cleaned);
}

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}

export function requireServerEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = serverEnv()[key];
  if (value === undefined || value === null) throw new MissingEnvError(key);
  return value as NonNullable<ServerEnv[K]>;
}
