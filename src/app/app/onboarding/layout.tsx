import Link from "next/link";

import { UserMenu } from "@/components/app/user-menu";
import { LogoMark } from "@/components/logo";
import { brand } from "@/lib/brand";

/** Focused, nav-free layout for the first-run flow. */
export default function OnboardingLayout({ children }: LayoutProps<"/app/onboarding">) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <LogoMark />
            <span className="text-lg">{brand.name}</span>
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
