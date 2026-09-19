import type { Metadata } from "next";

import { OwnerSignInForm } from "@/components/owner/owner-sign-in-form";
import { BrandMark } from "@/components/brand/brand-mark";
import { Card } from "@/components/ui/card";
import { safeNextPath } from "@/lib/app-url";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Owner sign-in" };

export default async function OwnerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "/owner");
  const ownerNext =
    next === "/owner" || (next.startsWith("/owner/") && !next.startsWith("/owner/sign-in"))
      ? next
      : "/owner";

  return (
    <div className="min-h-full bg-cloud">
      <header className="border-b border-navy/8 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center px-6 py-4">
          <BrandMark />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md px-6 py-16">
        <Card className="w-full">
          <p className="text-xs font-bold tracking-[0.16em] text-navy/60">PRIVATE</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Owner sign-in</h1>
          <p className="mt-3 leading-7 text-ink/75">
            This login is only for the KindCare owner dashboard. It is not the family or
            caregiver sign-in on the public homepage, and it does not use a separate stored
            password.
          </p>
          <div className="mt-7">
            <OwnerSignInForm next={ownerNext} />
          </div>
          <p className="mt-6 text-sm leading-6 text-navy/70">{brand.safety}</p>
        </Card>
      </main>
    </div>
  );
}
