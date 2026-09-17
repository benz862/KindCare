import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { safeNextPath } from "@/lib/app-url";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "");
  const invited = next.startsWith("/invite/");

  return (
    <PageShell className="flex items-start justify-center">
      <Card className="w-full max-w-md">
        <p className="text-xs font-bold tracking-[0.16em] text-navy/60">GET STARTED</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">
          {invited ? "Create your KindCare account" : "Create a caregiver account"}
        </h1>
        <p className="mt-3 leading-7 text-ink/75">
          {invited
            ? "Use the same email this invitation was sent to. After you confirm, you can join the private household."
            : "Start a private household for the person you support. We only ask for what KindCare needs to keep the space safe and personal."}
        </p>
        <div className="mt-7">
          <SignUpForm next={next} />
        </div>
        <p className="mt-5 text-sm text-navy/75">
          Already have an account?{" "}
          <Link
            className="font-semibold text-navy underline-offset-4 hover:underline"
            href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}
          >
            Sign in
          </Link>
        </p>
        <p className="mt-6 text-sm leading-6 text-navy/70">{brand.safety}</p>
      </Card>
    </PageShell>
  );
}
