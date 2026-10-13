"use client";

import { Briefcase, LayoutDashboard, type LucideIcon, SlidersHorizontal, SquareKanban, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ICONS = {
  overview: LayoutDashboard,
  jobs: Briefcase,
  tracker: SquareKanban,
  profile: UserRound,
  preferences: SlidersHorizontal,
} satisfies Record<string, LucideIcon>;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export const APP_NAV: NavItem[] = [
  { href: "/app", label: "Overview", icon: "overview" },
  { href: "/app/jobs", label: "Jobs", icon: "jobs" },
  { href: "/app/tracker", label: "Tracker", icon: "tracker" },
  { href: "/app/profile", label: "Profile", icon: "profile" },
  { href: "/app/preferences", label: "Preferences", icon: "preferences" },
];

function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`);
}

/** Vertical nav for the desktop sidebar. Reads the pathname, so render inside <Suspense>. */
export function SidebarNav({ items, root }: { items: NavItem[]; root: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href, root);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Scrollable pill nav under the mobile top bar. */
export function MobileNav({ items, root }: { items: NavItem[]; root: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-1.5 pb-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href, root);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Static stand-ins while the active item resolves. */
export function SidebarNavFallback({ items }: { items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <span key={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

export function MobileNavFallback() {
  return <div className="h-11" aria-hidden="true" />;
}
