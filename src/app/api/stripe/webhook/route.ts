import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { invoiceSubscriptionId, syncStripeSubscription } from "@/lib/billing/sync";
import { getStripe } from "@/lib/stripe/client";
import { getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe/env";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function markEvent(id: string, type: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("stripe_webhook_events").insert({ id, type });
  if (error) {
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }
  return true;
}

async function subscriptionFromEvent(event: Stripe.Event) {
  const stripe = getStripe();
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    return event.data.object;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.mode !== "subscription" || !session.subscription) return null;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    return stripe.subscriptions.retrieve(subscriptionId);
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const subscriptionId = invoiceSubscriptionId(event.data.object);
    if (!subscriptionId) return null;
    return stripe.subscriptions.retrieve(subscriptionId);
  }

  return null;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      payload,
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const firstTime = await markEvent(event.id, event.type);
  if (!firstTime) {
    return NextResponse.json({ received: true });
  }

  const householdId =
    "metadata" in event.data.object
      ? (event.data.object.metadata?.household_id ?? null)
      : null;

  const subscription = await subscriptionFromEvent(event);
  if (subscription) {
    await syncStripeSubscription(subscription, { householdId });
  }

  return NextResponse.json({ received: true });
}
