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
