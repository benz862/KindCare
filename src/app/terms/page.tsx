import type { Metadata } from "next";
import Link from "next/link";

import { SupportEmail } from "@/components/brand/support-email";
import { SupportPhone } from "@/components/brand/support-phone";
import { PageShell } from "@/components/layout/page-shell";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <PageShell>
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">
        KINDCARE · {brand.owner.toUpperCase()}
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Terms</h1>
      <div className="mt-6 grid gap-5 leading-7 text-ink/80">
        <p>{brand.ownerLine}</p>
        <p>{brand.safety}</p>
        <p>
          KindCare is intended for supportive companionship and household care
          coordination among people who know and trust one another. It is not a
          clinical record, a surveillance product, or an emergency-response service.
        </p>
        <p>
          Medication plans are caregiver-entered records. “Taken” means a person
          marked a dose as taken. It is not proof that medicine was administered.
        </p>
        <p>
          For product questions or account help, call KindCare customer support at{" "}
          <SupportPhone showLabel={false} /> or write to <SupportEmail />. Support cannot provide medical advice or
          send emergency services.
        </p>
        <p>
          This page is a first-release placeholder. Reviewed terms of use will replace
          it before any production launch.
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
