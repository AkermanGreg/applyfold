import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Shown on auth pages when Clerk keys aren't connected yet (fresh preview, CI, local dev). */
export function AuthUnavailable() {
  return (
    <div className="flex max-w-sm flex-col items-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Sign-in isn’t set up yet</h1>
      <p className="text-sm text-muted-foreground">
        This deployment doesn’t have its authentication keys connected. Join the waitlist and we’ll email you
        when accounts open.
      </p>
      <Button asChild>
        <Link href="/#waitlist">Back to the homepage</Link>
      </Button>
    </div>
  );
}
