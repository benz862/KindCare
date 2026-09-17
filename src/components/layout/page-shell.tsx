import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/cn";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-full flex-col bg-cloud">
      <SiteHeader />
      <main className={cn("mx-auto w-full max-w-3xl flex-1 px-6 py-10", className)}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
