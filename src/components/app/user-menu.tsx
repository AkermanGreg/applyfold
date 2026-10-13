"use client";

import { UserButton } from "@clerk/nextjs";

import { isAuthConfigured } from "@/lib/auth-config";

export function UserMenu({ showName = false }: { showName?: boolean }) {
  if (!isAuthConfigured) return null;
  return <UserButton showName={showName} appearance={{ elements: { userButtonBox: "flex-row-reverse" } }} />;
}
