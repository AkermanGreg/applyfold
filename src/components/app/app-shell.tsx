import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { LogoMark } from "@/components/logo";
import { brand } from "@/lib/brand";

import { MobileNav, MobileNavFallback, type NavItem, SidebarNav, SidebarNavFallback } from "./app-nav";

/**
 * Signed-in (and demo) chrome: a sticky sidebar on desktop, a compact top bar with pill nav on
 * phones. Slots let the real app and demo mode supply their own account area and banner.
 */
export function AppShell({
  nav,
  root,
  sidebarFooter,
  topBarEnd,
  banner,
  children,
}: {
  nav: NavItem[];
  root: string;
  sidebarFooter?: ReactNode;
  topBarEnd?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const logo = (
    <Link href={root} className="flex items-center gap-2 font-semibold tracking-tight">
      <LogoMark />
      <span className="text-lg">{brand.name}</span>
    </Link>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      {banner}
      <div className="flex flex-1 lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-background px-4 py-5 lg:flex">
          <div className="px-2">{logo}</div>
          <Suspense fallback={<SidebarNavFallback items={nav} />}>
            <SidebarNav items={nav} root={root} />
          </Suspense>
          <div className="mt-auto flex flex-col gap-3">{sidebarFooter}</div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/90 px-4 pt-3 backdrop-blur lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              {logo}
              {topBarEnd}
            </div>
            <Suspense fallback={<MobileNavFallback />}>
              <MobileNav items={nav} root={root} />
            </Suspense>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
