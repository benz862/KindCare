import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <PageShell className="flex items-start justify-center">
      <Card className="w-full max-w-md">
        <p className="text-xs font-bold tracking-[0.16em] text-navy/60">KINDCARE</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Reset your password</h1>
        <p className="mt-3 leading-7 text-ink/75">
          Enter the email on your KindCare account. We will send a reset link if that
          account exists.
        </p>
        <div className="mt-7">
          <ResetPasswordForm />
        </div>
        <p className="mt-5 text-sm">
          <Link className="font-semibold text-navy underline-offset-4 hover:underline" href="/sign-in">
            Back to sign in
          </Link>
        </p>
        <p className="mt-6 text-sm leading-6 text-navy/70">{brand.safety}</p>
      </Card>
    </PageShell>
  );
}
