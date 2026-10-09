import Link from "next/link";

import { brand } from "@/lib/brand";

/** A folded page: the product folds your background into each application. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M9 8h10l4 4v12H9z" className="fill-primary-foreground" />
      <path d="M19 8v4h4z" className="fill-brand-warm" />
      <path d="M12 16h8M12 19.5h8M12 23h5" className="stroke-primary" strokeWidth="1.6" strokeLinecap="round" />
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
