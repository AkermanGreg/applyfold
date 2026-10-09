/**
 * Clerk is optional until its keys are connected (fresh preview deploys, CI, local dev before
 * `vercel env pull`). Public pages keep working; signed-in areas explain what's missing.
 * NEXT_PUBLIC_ values are inlined at build time, so this is safe in client components too.
 */
export const isAuthConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
