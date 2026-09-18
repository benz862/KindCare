import type { Metadata } from "next";

import { HouseholdSettingsForm } from "@/components/auth/auth-form";
import { PasskeyEnrollment } from "@/components/auth/passkey-controls";
import { BillingCard } from "@/components/billing/billing-card";
import { AppShell } from "@/components/layout/app-shell";
import { SupportEmail } from "@/components/brand/support-email";
import { SupportPhone } from "@/components/brand/support-phone";
import { NotificationPrefsForm } from "@/components/plan/notification-prefs-form";
import { Card } from "@/components/ui/card";
import { requireHousehold } from "@/lib/auth/session";
import { loadHouseholdSubscription } from "@/lib/billing/subscription";
import { brand } from "@/lib/copy";
import { isStripeConfigured } from "@/lib/stripe/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const context = await requireHousehold();
  const { billing } = await searchParams;
  const organizer = context.membership.role === "organizer";
  const supabase = await createClient();
  const [{ data: profile }, subscription] = await Promise.all([
    supabase
      .from("profiles")
      .select("notify_in_app, notify_email")
      .eq("id", context.userId)
      .maybeSingle(),
    loadHouseholdSubscription(supabase, context.membership.household.id),
  ]);

  return (
    <AppShell
      displayName={context.displayName}
      role={context.membership.role}
      householdName={context.membership.household.name}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">SETTINGS</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Household and privacy</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        You are signed in as {context.displayName}
        {context.email ? ` (${context.email})` : ""}. KindCare never collects
        fingerprints, face scans, or device PINs. A passkey uses the device’s own Face ID, Touch ID,
        or unlock method without sharing that biometric information with KindCare.
      </p>

      <div className="mt-8 grid gap-5">
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Easy sign-in on this device</h2>
          <p className="mt-2 leading-7 text-ink/75">Set up a passkey once while signed in. After that, the member can use the familiar Face ID or device-unlock prompt instead of a password.</p>
          <div className="mt-5"><PasskeyEnrollment /></div>
        </Card>
        {organizer ? (
          <Card>
            <h2 className="font-serif text-2xl font-semibold text-navy">Household</h2>
            <div className="mt-5">
              <HouseholdSettingsForm
                name={context.membership.household.name}
                supportedPersonName={context.membership.household.supportedPersonName}
              />
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="font-serif text-2xl font-semibold text-navy">Household</h2>
            <p className="mt-2 leading-7 text-ink/75">
              {context.membership.household.name}
              {context.membership.household.supportedPersonName
                ? ` · supporting ${context.membership.household.supportedPersonName}`
                : ""}
            </p>
          </Card>
        )}
        <BillingCard
          organizer={organizer}
          configured={isStripeConfigured()}
          subscription={subscription}
          notice={billing}
        />
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Notices</h2>
          <p className="mt-2 leading-7 text-ink/75">
            In-app notices stay inside KindCare. Email is a saved preference only. Production is
            hosted at {brand.domain}.
          </p>
          <div className="mt-5">
            <NotificationPrefsForm
              notifyInApp={profile?.notify_in_app ?? true}
              notifyEmail={profile?.notify_email ?? false}
            />
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Help and limits</h2>
          <p className="mt-2 leading-7 text-ink/75">{brand.safety}</p>
          <p className="mt-3 leading-7 text-ink/75">
            For product questions, call KindCare customer support at <SupportPhone showLabel={false} />{" "}
            or write to <SupportEmail />. Billing: <SupportEmail address={brand.billingEmail} />.
            General questions: <SupportEmail address={brand.infoEmail} />. Support cannot provide
            medical advice or send emergency services.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
