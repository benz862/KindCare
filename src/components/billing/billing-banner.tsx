import Link from "next/link";

import {
  billingStatusLabel,
  householdHasCurrentBilling,
  type HouseholdSubscription,
} from "@/lib/billing/subscription";

export function BillingBanner({
  organizer,
  subscription,
}: {
  organizer: boolean;
  subscription: HouseholdSubscription | null;
}) {
  if (householdHasCurrentBilling(subscription)) return null;

  return (
    <div className="rounded-[24px] border border-navy/10 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,74,134,0.06)]">
      <p className="font-semibold text-navy">Household plan</p>
      <p className="mt-1 leading-7 text-ink/75">
        {billingStatusLabel(subscription?.status)}.{" "}
        {organizer ? (
          <>
            Start a 7-day trial or choose a KindCare plan in{" "}
            <Link className="font-semibold text-navy underline-offset-4 hover:underline" href="/settings">
              Settings
            </Link>
            .
          </>
        ) : (
          "Ask the household organizer to start a KindCare plan in Settings."
        )}
      </p>
    </div>
  );
}
