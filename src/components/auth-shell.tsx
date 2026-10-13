import { BadgeCheck, Hand, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LogoMark } from "@/components/logo";
import { brand } from "@/lib/brand";

const POINTS = [
  { icon: Sparkles, text: "Roles scored against your real experience, with a reason for each" },
  { icon: BadgeCheck, text: "Cover letters and answers written only from facts you’ve given us" },
  { icon: Hand, text: "Nothing is submitted without your say-so" },
];

/** Split layout for sign-in / sign-up: brand story on the left, the form on the right. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-ink-foreground lg:flex">
        <div className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-coral/30 blur-3xl" aria-hidden="true" />
        <Link href="/" className="relative flex items-center gap-2 font-semibold tracking-tight">
          <LogoMark inverted />
          <span className="text-lg">{brand.name}</span>
        </Link>
        <div className="relative max-w-md">
          <p className="font-display text-5xl leading-[1.05]">Applications that sound like you, not like a bot.</p>
          <ul className="mt-10 flex flex-col gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-ink-foreground/85">
                <Icon className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-ink-foreground/60">Built for nurses, teachers, trades, sales, office roles and tech.</p>
      </aside>
      <main className="flex flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-12">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight lg:hidden">
          <LogoMark />
          <span className="text-lg">{brand.name}</span>
        </Link>
        <div className="text-center">
          <h1 className="font-display text-4xl tracking-tight">{title}</h1>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
