import Link from "next/link";
import { Suspense } from "react";

import { BackendStatus } from "@/components/backend-status";
import { NavLinks } from "@/components/nav-links";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" prefetch className="text-sm font-semibold tracking-tight">
          Portfolio Manager
        </Link>

        <div className="flex items-center gap-4">
          <Suspense
            fallback={
              <span className="text-xs text-muted-foreground">Checking API…</span>
            }
          >
            <BackendStatus />
          </Suspense>
          <NavLinks />
        </div>
      </div>
    </header>
  );
}
