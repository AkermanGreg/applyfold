import { Suspense } from "react";

import { AppNav, AppNavFallback } from "@/components/app/app-nav";
import { SiteHeader } from "@/components/site-header";

/**
 * Layouts render in parallel with pages, so they can't gate access. Every page and Server
 * Action under /app calls `requireUserId()` itself; loading.tsx gives each page a Suspense
 * boundary so those session reads stream in while the header stays in the static shell.
 */
export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-16 sm:px-6">
        <Suspense fallback={<AppNavFallback />}>
          <AppNav />
        </Suspense>
        <main className="pt-8">{children}</main>
      </div>
    </>
  );
}
