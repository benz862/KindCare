import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HouseholdSetupForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/roles";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Start a household" };

export default async function OnboardingPage() {
  const context = await requireSession();
  if (context.membership) {
    redirect(homePathForRole(context.membership.role));
  }

  return (
    <PageShell className="flex items-start justify-center">
      <Card className="w-full max-w-lg">
        <p className="text-xs font-bold tracking-[0.16em] text-navy/60">WELCOME</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">
          Hello, {context.displayName}
        </h1>
        <p className="mt-3 leading-7 text-ink/75">
          Name a private household for the person you support. KindCare keeps this
          space only for people you invite.
        </p>
        <div className="mt-7">
          <HouseholdSetupForm />
        </div>
        <p className="mt-6 text-sm leading-6 text-navy/70">{brand.safety}</p>
      </Card>
    </PageShell>
  );
}
