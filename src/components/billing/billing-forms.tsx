"use client";

import { useActionState } from "react";

import { openCustomerPortal, startCheckout, type BillingFormState } from "@/app/billing-actions";
import { Button } from "@/components/ui/button";
import type { KindCarePlan } from "@/lib/billing/plans";
import { formatUsd } from "@/lib/billing/money";

const initial: BillingFormState = {};

export function CheckoutButtons({
  plan,
  offerTrial,
}: {
  plan: KindCarePlan;
  offerTrial: boolean;
}) {
  const [state, action, pending] = useActionState(startCheckout, initial);

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <form action={action}>
        <input name="priceId" type="hidden" value={plan.monthlyPriceId} />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Opening Stripe…" : `Monthly · ${formatUsd(plan.monthlyCents)}`}
        </Button>
      </form>
      <form action={action}>
        <input name="priceId" type="hidden" value={plan.annualPriceId} />
        <Button type="submit" variant="secondary" disabled={pending} className="w-full">
          {pending ? "Opening Stripe…" : `Yearly · ${formatUsd(plan.annualCents)}`}
        </Button>
      </form>
      {offerTrial ? (
        <p className="sm:col-span-2 text-sm text-navy/70">
          New households start with a 7-day trial. Stripe collects a payment method and does not
          charge until the trial ends.
        </p>
      ) : null}
      {state.error ? (
        <p className="sm:col-span-2 rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

export function ManageBillingButton() {
  const [state, action, pending] = useActionState(openCustomerPortal, initial);

  return (
    <form action={action} className="mt-4 grid gap-3">
      <Button type="submit" disabled={pending}>
        {pending ? "Opening Stripe…" : "Manage billing in Stripe"}
      </Button>
      {state.error ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
