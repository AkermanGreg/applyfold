import Link from "next/link";

import { brand } from "@/lib/brand";

/** A folded page: the product folds your background into each application. */
export function LogoMark({ className = "size-7", inverted = false }: { className?: string; inverted?: boolean }) {
  // Inverted swaps tile and page colors for use on the teal brand panel.
  const tile = inverted ? "fill-primary-foreground" : "fill-primary";
  const page = inverted ? "fill-primary" : "fill-primary-foreground";
  const lines = inverted ? "stroke-primary-foreground" : "stroke-primary";
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" className={tile} />
      <path d="M9 8h10l4 4v12H9z" className={page} />
      <path d="M19 8v4h4z" className="fill-brand-warm" />
      <path d="M12 16h8M12 19.5h8M12 23h5" className={lines} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <LogoMark />
      <span className="text-lg">{brand.name}</span>
    </Link>
  );
}
