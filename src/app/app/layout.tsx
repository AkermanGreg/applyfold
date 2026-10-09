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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </>
  );
}
