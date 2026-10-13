import { Suspense } from "react";

import { AccountCard, AccountCardFallback } from "@/components/app/account-card";
import { APP_NAV } from "@/components/app/app-nav";
import { AppShell } from "@/components/app/app-shell";
import { UserMenu } from "@/components/app/user-menu";

/**
 * Layouts render in parallel with pages, so they can't gate access. Every page and Server
 * Action calls `requireUserId()` (via requireAppUser) itself; loading.tsx gives each page a
 * Suspense boundary so session reads stream in while the shell stays in the static shell.
 */
export default function WorkspaceLayout({ children }: LayoutProps<"/app">) {
  return (
    <AppShell
      nav={APP_NAV}
      root="/app"
      topBarEnd={<UserMenu />}
      sidebarFooter={
        <Suspense fallback={<AccountCardFallback />}>
          <AccountCard />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
