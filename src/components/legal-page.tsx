import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
          Draft for early access. This page will be reviewed and finalized before public launch.
        </p>
        <div className="mt-8 flex flex-col gap-6 leading-relaxed [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-medium [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
