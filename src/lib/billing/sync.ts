import type Stripe from "stripe";

import { getAppUrl } from "@/lib/app-url";
import { kindCarePlans } from "@/lib/billing/plans";
import {
  customerIdFrom,
  subscriptionIdFrom,
  subscriptionPeriodEnd,
  subscriptionPriceId,
  unixToIso,
} from "@/lib/billing/subscription";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/admin";

const subscriptionStatuses = new Set([
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
]);

function asStatus(status: string) {
  return subscriptionStatuses.has(status) ? status : "incomplete";
}

export async function ensureCustomerPortalConfiguration() {
  const stripe = getStripe();
  const existing = await stripe.billingPortal.configurations.list({ limit: 1, active: true });
  if (existing.data[0]) return existing.data[0].id;

  const appUrl = getAppUrl();
  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Manage KindCare household billing",
      privacy_policy_url: `${appUrl}/privacy`,
      terms_of_service_url: `${appUrl}/terms`,
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["email", "address", "name"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: kindCarePlans.map((plan) => ({
          product: plan.productId,
          prices: [plan.monthlyPriceId, plan.annualPriceId],
        })),
      },
    },
  });
  return configuration.id;
}

export function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const value = invoice.parent?.subscription_details?.subscription;
  return subscriptionIdFrom(value);
}

export async function householdIdFromStripeCustomer(customerId: string | null) {
  if (!customerId) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("household_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.household_id ?? null;
}

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  extra?: { householdId?: string | null },
) {
  const supabase = createServiceClient();
  const customerId = customerIdFrom(subscription.customer);
  const householdId =
    extra?.householdId ||
    subscription.metadata.household_id ||
    (customerId
      ? (
          await supabase
            .from("subscriptions")
            .select("household_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle()
        ).data?.household_id
      : null);

  if (!householdId || !customerId) {
    return householdId ?? null;
  }

  const payload = {
    household_id: householdId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscriptionPriceId(subscription),
    status: asStatus(subscription.status),
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: subscriptionPeriodEnd(subscription),
    trial_end: unixToIso(subscription.trial_end),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("subscriptions").upsert(payload, {
    onConflict: "household_id",
  });
  if (error) {
    throw new Error(error.message);
  }

  const organizerId = subscription.metadata.organizer_profile_id;
  await supabase.from("audit_events").insert({
    household_id: householdId,
    actor_profile_id:
      organizerId && /^[0-9a-f-]{36}$/i.test(organizerId) ? organizerId : null,
    event_type: "billing.subscription_updated",
    outcome: "success",
    metadata: {
      status: payload.status,
      stripe_subscription_id: subscription.id,
      stripe_price_id: payload.stripe_price_id,
    },
  });

  return householdId;
}
