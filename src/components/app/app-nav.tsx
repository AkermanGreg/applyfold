"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

export const APP_NAV: NavItem[] = [
  { href: "/app", label: "Overview" },
  { href: "/app/jobs", label: "Jobs" },
  { href: "/app/tracker", label: "Tracker" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/preferences", label: "Preferences" },
];

function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`);
}

/** Horizontal, scrollable on phones. Reads the pathname, so render it inside <Suspense>. */
export function AppNav({ items = APP_NAV, root = "/app" }: { items?: NavItem[]; root?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b">
        {items.map((item) => {
          const active = isActive(pathname, item.href, root);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-block border-b-2 px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Static stand-in while the active tab resolves. */
export function AppNavFallback({ items = APP_NAV }: { items?: NavItem[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b">
        {items.map((item) => (
          <li key={item.href} className="px-3 py-2 text-sm text-muted-foreground">
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
