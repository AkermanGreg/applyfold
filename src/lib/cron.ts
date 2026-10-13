import "server-only";

import { serverEnv } from "@/lib/env";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; anything else is rejected. */
export function isAuthorizedCron(request: Request): boolean {
  const secret = serverEnv().CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
