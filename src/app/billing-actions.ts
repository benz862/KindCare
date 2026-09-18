"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";

import { getAppUrl } from "@/lib/app-url";
import { KINDCARE_TRIAL_DAYS, isKnownPriceId } from "@/lib/billing/plans";
import { ensureCustomerPortalConfiguration } from "@/lib/billing/sync";
import { isCurrentBillingStatus, loadHouseholdSubscription } from "@/lib/billing/subscription";
import { requireCareTeam } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/stripe/env";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export type BillingFormState = {
  error?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

async function requireOrganizer() {
  const context = await requireCareTeam();
  if (context.membership.role !== "organizer") {
    return { error: "Only the household organizer can manage billing." } as const;
  }
  if (!isStripeConfigured()) {
    return {
      error: "KindCare billing is not connected yet. Add the SkillBinder Stripe keys on Vercel.",
    } as const;
  }
  return { context } as const;
}

export async function startCheckout(
  _: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const auth = await requireOrganizer();
  if ("error" in auth) return { error: auth.error };

  const priceId = formValue(formData, "priceId");
  if (!isKnownPriceId(priceId)) {
    return { error: "That KindCare plan is not available." };
  }

  const { context } = auth;
  const supabase = await createClient();
  const existing = await loadHouseholdSubscription(supabase, context.membership.household.id);
  const stripe = getStripe();
  const appUrl = getAppUrl();
  const offerTrial = !existing || !isCurrentBillingStatus(existing.status);
  const returningCustomer = Boolean(existing?.stripe_customer_id);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url: `${appUrl}/settings?billing=canceled`,
    client_reference_id: context.membership.household.id,
    customer: existing?.stripe_customer_id || undefined,
    customer_email: existing?.stripe_customer_id ? undefined : context.email || undefined,
    customer_update: returningCustomer ? { address: "auto", name: "auto" } : undefined,
    allow_promotion_codes: true,
    billing_address_collection: returningCustomer ? "required" : undefined,
    automatic_tax: { enabled: false },
    integration_identifier: `kindcare-household-${randomBytes(4).toString("hex")}`,
    metadata: {
      household_id: context.membership.household.id,
      organizer_profile_id: context.userId,
    },
    subscription_data: {
      billing_mode: { type: "flexible" },
      trial_period_days: offerTrial ? KINDCARE_TRIAL_DAYS : undefined,
      metadata: {
        household_id: context.membership.household.id,
        organizer_profile_id: context.userId,
      },
    },
  });

  if (!session.url) {
    return { error: "Stripe did not return a checkout page." };
  }

  redirect(session.url);
}

export async function openCustomerPortal(
  _: BillingFormState,
  _formData: FormData,
): Promise<BillingFormState> {
  const auth = await requireOrganizer();
  if ("error" in auth) return { error: auth.error };

  const { context } = auth;
  const supabase = await createClient();
  const existing = await loadHouseholdSubscription(supabase, context.membership.household.id);
  if (!existing?.stripe_customer_id) {
    return { error: "Start a KindCare plan before opening the billing portal." };
  }

  const configuration = await ensureCustomerPortalConfiguration();
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: existing.stripe_customer_id,
    configuration,
    return_url: `${getAppUrl()}/settings`,
  });

  redirect(session.url);
}
