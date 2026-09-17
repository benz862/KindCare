import type { Metadata } from "next";
import Link from "next/link";

import { SupportEmail } from "@/components/brand/support-email";
import { SupportPhone } from "@/components/brand/support-phone";
import { PageShell } from "@/components/layout/page-shell";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <PageShell>
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">
        KINDCARE · {brand.owner.toUpperCase()}
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Privacy notice</h1>
      <div className="mt-6 grid gap-5 leading-7 text-ink/80">
        <p>{brand.ownerLine}</p>
        <p>{brand.safety}</p>
        <p>
          KindCare is a private family coordination and connection space. Household
          information is shown only to people who are invited and permitted to see it.
        </p>
        <p>
          KindCare does not collect fingerprints, face scans, or device PINs. Passkeys may be
          added later so a person can unlock the app with Face ID, Touch ID, or another device
          method without KindCare receiving biometric data.
        </p>
        <p>
          For an immediate emergency, call 911 or your local emergency number, or
          contact a trusted person. KindCare does not dispatch emergency services.
        </p>
        <p>
          For product questions or account help, call KindCare customer support at{" "}
          <SupportPhone showLabel={false} /> or write to <SupportEmail />. Support cannot
          provide medical advice or send emergency services. Billing questions can go to{" "}
          <SupportEmail address={brand.billingEmail} />, and general questions to{" "}
          <SupportEmail address={brand.infoEmail} />.
        </p>
        <p>
          This page is a first-release placeholder. A reviewed privacy policy will
          replace it before any production launch.
        </p>
        <p>
          <Link className="font-semibold text-navy underline-offset-4 hover:underline" href="/">
            Return to KindCare
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
