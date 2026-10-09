"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { isAuthConfigured } from "@/lib/auth-config";

/** Client-side so marketing pages stay in the static shell; auth state hydrates after load. */
export function AuthNav() {
  return isAuthConfigured ? <ClerkAuthNav /> : <SignInLink />;
}

function SignInLink() {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href="/sign-in">Sign in</Link>
    </Button>
  );
}

function ClerkAuthNav() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <div className="h-8 w-20" aria-hidden="true" />;

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild size="sm">
          <Link href="/app">Open app</Link>
        </Button>
        <UserButton />
      </div>
    );
  }

  return <SignInLink />;
}
