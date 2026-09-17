import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { safeNextPath } from "@/lib/app-url";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "");
  const errorMessage =
    params.error === "callback"
      ? "That sign-in link could not be used. Please try again."
      : params.error === "auth"
        ? "That sign-in request was cancelled."
        : null;

  return (
    <PageShell className="flex items-start justify-center">
      <Card className="w-full max-w-md">
        <p className="text-xs font-bold tracking-[0.16em] text-navy/60">KINDCARE</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Welcome back</h1>
        <p className="mt-3 leading-7 text-ink/75">
          Sign in with your email and password. On a later step you can add Face ID,
          Touch ID, or another device unlock method through a passkey.
        </p>
        {errorMessage ? (
          <p className="mt-4 rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-7">
          <SignInForm next={next} />
        </div>
        <p className="mt-4 text-sm">
          <Link className="font-semibold text-navy underline-offset-4 hover:underline" href="/reset-password">
            Forgot password?
          </Link>
        </p>
        <p className="mt-6 text-sm leading-6 text-navy/70">{brand.safety}</p>
      </Card>
    </PageShell>
  );
}
