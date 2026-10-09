import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { isAuthConfigured } from "@/lib/auth-config";

/**
 * Data-access-layer gate. Call at the top of every protected page, route handler and Server
 * Action. Redirects signed-out visitors to sign-in and returns the Clerk user id otherwise.
 */
export async function requireUserId(): Promise<string> {
  if (!isAuthConfigured) {
    await connection(); // decide per request, not at prerender time
    redirect("/sign-in");
  }
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}
