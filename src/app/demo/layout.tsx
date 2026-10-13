import { Sparkles } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import type { NavItem } from "@/components/app/app-nav";
import { AppShell } from "@/components/app/app-shell";
import { DemoProvider } from "@/components/demo/demo-provider";
import { Button } from "@/components/ui/button";

export const metadata = { title: { default: "Demo", template: "%s · Demo · Applyfold" } };

const DEMO_NAV: NavItem[] = [
  { href: "/demo", label: "Overview", icon: "overview" },
  { href: "/demo/jobs", label: "Jobs", icon: "jobs" },
  { href: "/demo/tracker", label: "Tracker", icon: "tracker" },
  { href: "/demo/profile", label: "Profile", icon: "profile" },
];

/** Request-time "now" so seeded dates (applied 9 days ago, follow-up due) stay relative. */
async function DemoRoot({ children }: { children: ReactNode }) {
  await connection();
  return <DemoProvider now={new Date().toISOString()}>{children}</DemoProvider>;
}

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <AppShell
      nav={DEMO_NAV}
      root="/demo"
      banner={
        <div className="bg-brand-warm px-4 py-2 text-center text-sm text-brand-warm-foreground">
          You’re exploring a demo with a sample nurse’s data. Nothing is saved and no AI is called.{" "}
          <Link href="/sign-up" className="font-medium underline">
            Create your free account
          </Link>
        </div>
      }
      topBarEnd={
        <Button asChild size="sm">
          <Link href="/sign-up">Sign up</Link>
        </Button>
      }
      sidebarFooter={
        <div className="rounded-xl border bg-muted/50 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-medium">
            <Sparkles className="size-4 text-primary" aria-hidden="true" /> Like what you see?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Bring your own resume and get real matches in about two minutes.</p>
          <Button asChild size="sm" className="mt-3 w-full">
            <Link href="/sign-up">Get started free</Link>
          </Button>
        </div>
      }
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-muted" />}>
        <DemoRoot>{children}</DemoRoot>
      </Suspense>
    </AppShell>
  );
}
