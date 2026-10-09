import Link from "next/link";

import { AuthNav } from "@/components/auth-nav";
import { Logo } from "@/components/logo";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#principles", label: "Principles" },
  { href: "/#pricing", label: "Pricing" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <AuthNav />
      </div>
    </header>
  );
}
