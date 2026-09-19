import type { Metadata } from "next";

import { ContinueSetupButton } from "@/components/patient/continue-setup-button";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { brand } from "@/lib/copy";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set up KindCare" };

export default async function PatientSetupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("preview_patient_setup", { p_token: token });
  const preview = data?.[0];

  if (!preview) {
    return (
      <PageShell className="flex items-start justify-center">
        <Card className="w-full max-w-lg">
          <h1 className="font-serif text-4xl font-semibold text-navy">This link is no longer valid</h1>
          <p className="mt-4 text-lg leading-8 text-ink/75">
            Ask your caregiver to send a new KindCare setup link. You do not need a password or the
            App Store.
          </p>
          <ButtonLink href="/" className="mt-6">
            Return to KindCare
          </ButtonLink>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="flex items-start justify-center">
      <Card className="w-full max-w-lg">
        <p className="text-xs font-bold tracking-[0.16em] text-navy/60">KINDCARE</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold text-navy">Hello, {preview.patient_display_name}</h1>
        <p className="mt-4 text-xl leading-9 text-ink/80">
          {preview.caregiver_display_name} set this up for you. Tap Continue on this phone.
        </p>
        <div className="mt-8">
          <ContinueSetupButton token={token} />
        </div>
        <p className="mt-6 text-base leading-7 text-navy/70">{brand.safety}</p>
      </Card>
    </PageShell>
  );
}
