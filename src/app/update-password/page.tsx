import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function UpdatePasswordPage() {
  await requireSession();

  return (
    <PageShell className="flex items-start justify-center">
      <Card className="w-full max-w-md">
        <p className="text-xs font-bold tracking-[0.16em] text-navy/60">KINDCARE</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Choose a new password</h1>
        <p className="mt-3 leading-7 text-ink/75">
          Use at least 12 characters. After you save, you will return to your KindCare
          household.
        </p>
        <div className="mt-7">
          <UpdatePasswordForm />
        </div>
        <p className="mt-6 text-sm leading-6 text-navy/70">{brand.safety}</p>
      </Card>
    </PageShell>
  );
}
