import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

import { AuthUnavailable } from "@/components/auth-unavailable";
import { isAuthConfigured } from "@/lib/auth-config";

export const metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      {isAuthConfigured ? (
        // Clerk reads the URL, so it streams in after the static shell.
        <Suspense fallback={<div className="h-[480px] w-[400px] max-w-full animate-pulse rounded-xl bg-muted" />}>
          <SignUp />
        </Suspense>
      ) : (
        <AuthUnavailable />
      )}
    </main>
  );
}
