import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isStripeConfigured } from "@/lib/stripe/env";
import type { Database } from "@/lib/supabase/database.types";

export type HouseholdSubscription = Database["public"]["Tables"]["subscriptions"]["Row"];

const currentStatuses = new Set(["trialing", "active", "past_due"]);

export function isCurrentBillingStatus(status: string | null | undefined) {
  return Boolean(status && currentStatuses.has(status));
}

export function billingStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "trialing":
      return "7-day trial";
    case "active":
      return "Active";
    case "past_due":
      return "Payment past due";
    case "canceled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    case "paused":
      return "Paused";
    case "incomplete":
    case "incomplete_expired":
      return "Checkout not finished";
    default:
      return "No household plan yet";
  }
}

export async function loadHouseholdSubscription(
  supabase: SupabaseClient<Database>,
  householdId: string,
) {
  const { data } = await supabase
    .from("subscriptions")
    .select(
      "id, household_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, cancel_at_period_end, current_period_end, trial_end, created_at, updated_at",
    )
    .eq("household_id", householdId)
    .maybeSingle();
  return data;
}

export function householdHasCurrentBilling(subscription: HouseholdSubscription | null) {
  if (!isStripeConfigured()) return true;
  return isCurrentBillingStatus(subscription?.status);
}

export function unixToIso(value: number | null | undefined) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

export function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  return unixToIso(item?.current_period_end);
}

export function subscriptionPriceId(subscription: Stripe.Subscription) {
  const price = subscription.items.data[0]?.price;
  return typeof price === "string" ? price : price?.id ?? null;
}

export function customerIdFrom(value: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id;
}

export function subscriptionIdFrom(
  value: string | Stripe.Subscription | null | undefined,
) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id;
}
