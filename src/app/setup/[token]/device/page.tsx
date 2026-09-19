import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PasskeyEnrollment } from "@/components/auth/passkey-controls";
import { AddToHomeCard } from "@/components/patient/add-to-home-card";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { requireMemberHome } from "@/lib/auth/session";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Unlock this phone" };

export default async function PatientDeviceSetupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await params;
  const context = await requireMemberHome();
  if (!context.activePatient) {
    redirect("/home");
  }

  return (
    <PageShell className="flex items-start justify-center">
      <div className="grid w-full max-w-lg gap-5">
        <Card>
          <h1 className="font-serif text-4xl font-semibold text-navy">Unlock this phone</h1>
          <p className="mt-4 text-lg leading-8 text-ink/75">
            Set up Face ID, Touch ID, or your device passcode for KindCare. KindCare never receives
            your biometric data or PIN.
          </p>
          <div className="mt-6">
            <PasskeyEnrollment />
          </div>
        </Card>
        <AddToHomeCard />
        <ButtonLink href="/home" size="member" className="w-full">
          Continue to KindCare
        </ButtonLink>
        <p className="text-sm leading-6 text-navy/70">{brand.safety}</p>
      </div>
    </PageShell>
  );
}
