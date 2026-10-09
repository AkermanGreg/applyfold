import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { AppNav, AppNavFallback, type NavItem } from "@/components/app/app-nav";
import { DemoProvider } from "@/components/demo/demo-provider";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: { default: "Demo", template: "%s · Demo · Applyfold" } };

const DEMO_NAV: NavItem[] = [
  { href: "/demo", label: "Overview" },
  { href: "/demo/jobs", label: "Jobs" },
  { href: "/demo/tracker", label: "Tracker" },
  { href: "/demo/profile", label: "Profile" },
];

/** Request-time "now" so seeded dates (applied 9 days ago, follow-up due) stay relative. */
async function DemoRoot({ children }: { children: ReactNode }) {
  await connection();
  return <DemoProvider now={new Date().toISOString()}>{children}</DemoProvider>;
}

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <>
      <div className="bg-brand-warm px-4 py-2 text-center text-sm text-brand-warm-foreground">
        Demo with a sample nurse’s data. Nothing is saved and no AI is called.{" "}
        <Link href="/#waitlist" className="font-medium underline">
          Get early access
        </Link>
      </div>
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-16 sm:px-6">
        <Suspense fallback={<AppNavFallback items={DEMO_NAV} />}>
          <AppNav items={DEMO_NAV} root="/demo" />
        </Suspense>
        <main className="pt-8">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
            <DemoRoot>{children}</DemoRoot>
          </Suspense>
        </main>
      </div>
    </>
  );
}
