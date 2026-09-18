import { CheckoutButtons, ManageBillingButton } from "@/components/billing/billing-forms";
import { Card } from "@/components/ui/card";
import { kindCarePlans, planForPriceId } from "@/lib/billing/plans";
import {
  billingStatusLabel,
  isCurrentBillingStatus,
  type HouseholdSubscription,
} from "@/lib/billing/subscription";
import { brand } from "@/lib/copy";
import { SupportEmail } from "@/components/brand/support-email";

function billingNotice(flag: string | undefined) {
  if (flag === "success") {
    return "Stripe accepted the checkout. KindCare updates household billing from the Stripe webhook, not from this page.";
  }
  if (flag === "canceled") {
    return "Checkout was canceled. No charge was made.";
  }
  if (flag === "required") {
    return "The household organizer needs an active KindCare plan to keep billing current.";
  }
  return null;
}

export function BillingCard({
  organizer,
  configured,
  subscription,
  notice,
}: {
  organizer: boolean;
  configured: boolean;
  subscription: HouseholdSubscription | null;
  notice?: string;
}) {
  const plan = planForPriceId(subscription?.stripe_price_id);
  const current = isCurrentBillingStatus(subscription?.status);
  const message = billingNotice(notice);

  return (
    <Card>
      <h2 className="font-serif text-2xl font-semibold text-navy">Household billing</h2>
      <p className="mt-2 leading-7 text-ink/75">
        The household organizer is the billing owner. KindCare uses Stripe Checkout and the Stripe
        customer portal. Card details never enter KindCare. Stripe calculates sales tax at checkout
        from the organizer’s address, in places where SkillBinder is registered to collect tax.
        Subscription status is written only by Stripe webhooks.
      </p>
      {message ? (
        <p className="mt-4 rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {message}
        </p>
      ) : null}
      <p className="mt-4 leading-7 text-ink/75">
        Status: {billingStatusLabel(subscription?.status)}
        {plan ? ` · ${plan.name}` : ""}
        {subscription?.cancel_at_period_end ? " · cancels at period end" : ""}
        {subscription?.trial_end
          ? ` · trial ends ${new Date(subscription.trial_end).toLocaleDateString("en-US")}`
          : ""}
        {subscription?.current_period_end
          ? ` · current period ends ${new Date(subscription.current_period_end).toLocaleDateString("en-US")}`
          : ""}
        .
      </p>
      {!configured ? (
        <p className="mt-4 leading-7 text-ink/75">
          SkillBinder Stripe products are ready. Add the Stripe secret key and webhook signing secret
          on Vercel, then organizers can start a 7-day trial from this page. Billing questions:{" "}
          <SupportEmail address={brand.billingEmail} />.
        </p>
      ) : null}
      {configured && organizer && current && subscription?.stripe_customer_id ? (
        <ManageBillingButton />
      ) : null}
      {configured && organizer ? (
        <div className="mt-6 grid gap-5">
          {kindCarePlans.map((item) => (
            <div key={item.key} className="rounded-2xl border border-navy/10 bg-cloud/60 p-5">
              <h3 className="font-serif text-xl font-semibold text-navy">{item.name}</h3>
              <p className="mt-2 leading-7 text-ink/75">{item.summary}</p>
              <CheckoutButtons plan={item} offerTrial={!current} />
            </div>
          ))}
        </div>
      ) : null}
      {configured && !organizer ? (
        <p className="mt-4 leading-7 text-ink/75">
          Ask the household organizer to start or update the KindCare plan.
        </p>
      ) : null}
    </Card>
  );
}
