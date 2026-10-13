import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth-shell";
import { AuthUnavailable } from "@/components/auth-unavailable";
import { isAuthConfigured } from "@/lib/auth-config";

export const metadata = { title: "Create your account" };

export default function SignUpPage() {
  if (!isAuthConfigured) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <AuthUnavailable />
      </main>
    );
  }
  return (
    <AuthShell title="Start applying smarter" subtitle="Free to start. No credit card.">
      {/* Clerk reads the URL, so it streams in after the static shell. */}
      <Suspense fallback={<div className="h-[440px] w-[400px] max-w-full animate-pulse rounded-2xl bg-muted" />}>
        <SignUp appearance={{ elements: { cardBox: "shadow-xl", header: "hidden", headerTitle: "hidden", headerSubtitle: "hidden" } }} />
      </Suspense>
    </AuthShell>
  );
}
