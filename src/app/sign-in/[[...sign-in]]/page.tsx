import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth-shell";
import { AuthUnavailable } from "@/components/auth-unavailable";
import { isAuthConfigured } from "@/lib/auth-config";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  if (!isAuthConfigured) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <AuthUnavailable />
      </main>
    );
  }
  return (
    <AuthShell title="Welcome back" subtitle="Pick up where you left off.">
      {/* Clerk reads the URL, so it streams in after the static shell. */}
      <Suspense fallback={<div className="h-[440px] w-[400px] max-w-full animate-pulse rounded-2xl bg-muted" />}>
        <SignIn appearance={{ elements: { cardBox: "shadow-xl", header: "hidden", headerTitle: "hidden", headerSubtitle: "hidden" } }} />
      </Suspense>
    </AuthShell>
  );
}
