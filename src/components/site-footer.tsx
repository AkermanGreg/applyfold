import Link from "next/link";

import { LogoMark } from "@/components/logo";
import { brand } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <LogoMark className="size-5" />
          <span>{brand.name}</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <a href={brand.repoUrl} className="hover:text-foreground" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
