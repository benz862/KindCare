import type { ReactNode } from "react";

import { signOut } from "@/app/auth-actions";
import { BrandMark } from "@/components/brand/brand-mark";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export function PatientShell({
  children,
  displayName,
}: {
  children: ReactNode;
  displayName: string;
}) {
  return (
    <div className="flex min-h-full flex-col bg-cloud">
      <header className="border-b border-navy/8 bg-white/90">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-5 py-4">
          <BrandMark />
          <div className="flex items-center gap-3">
            <p className="text-base font-semibold text-navy">{displayName}</p>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="compact">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
