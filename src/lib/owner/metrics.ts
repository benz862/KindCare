import { formatUsd, kindCarePlans, kindCareFreeTrial } from "../billing/plans.ts";

export const ownerAttentionWebhookTypes = [
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "customer.subscription.deleted",
] as const;

export const ownerAttentionStatuses = ["past_due", "unpaid", "incomplete"] as const;

export type OwnerSubscriptionRow = {
  status: string;
  stripePriceId: string | null;
  cancelAtPeriodEnd: boolean;
};

export function monthlyCentsForPriceId(priceId: string | null | undefined) {
  if (!priceId) return 0;
  if (priceId === kindCareFreeTrial.priceId) return 0;
  const plan = kindCarePlans.find(
    (item) => item.monthlyPriceId === priceId || item.annualPriceId === priceId,
  );
  if (!plan) return 0;
  if (plan.monthlyPriceId === priceId) return plan.monthlyCents;
  return Math.round(plan.annualCents / 12);
}

export function estimatedMrrCents(rows: OwnerSubscriptionRow[]) {
  return rows
    .filter((row) => row.status === "active" || row.status === "trialing")
    .reduce((sum, row) => sum + monthlyCentsForPriceId(row.stripePriceId), 0);
}

export function countByStatus(rows: OwnerSubscriptionRow[]) {
  const counts: Record<string, number> = {
    trialing: 0,
    active: 0,
    canceled: 0,
    past_due: 0,
    unpaid: 0,
    incomplete: 0,
    incomplete_expired: 0,
    paused: 0,
  };
  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}

function catalogPlan(priceId: string | null | undefined) {
  if (!priceId) return null;
  if (priceId === kindCareFreeTrial.priceId) return { name: kindCareFreeTrial.name, interval: null };
  const plan = kindCarePlans.find(
    (item) => item.monthlyPriceId === priceId || item.annualPriceId === priceId,
  );
  if (!plan) return null;
  return {
    name: plan.name,
    interval: plan.monthlyPriceId === priceId ? "monthly" : "annual",
  };
}

export function planName(priceId: string | null | undefined) {
  return catalogPlan(priceId)?.name ?? "Unknown plan";
}

export function planLabel(priceId: string | null | undefined) {
  const plan = catalogPlan(priceId);
  if (!plan) return "Unknown plan";
  return plan.interval ? `${plan.name} ${plan.interval}` : plan.name;
}

export function planMix(rows: OwnerSubscriptionRow[]) {
  const mix = new Map<string, { name: string; count: number }>();
  for (const row of rows) {
    if (row.status !== "active" && row.status !== "trialing") continue;
    const name = planName(row.stripePriceId);
    const current = mix.get(name) ?? { name, count: 0 };
    current.count += 1;
    mix.set(name, current);
  }
  return [...mix.values()].sort((a, b) => b.count - a.count);
}

export function stripeDashboardUrl(params: {
  livemode: boolean;
  kind: "subscriptions" | "customers" | "events" | "invoices";
  id: string;
}) {
  const base = params.livemode ? "https://dashboard.stripe.com" : "https://dashboard.stripe.com/test";
  return `${base}/${params.kind}/${encodeURIComponent(params.id)}`;
}

export function formatMrr(cents: number) {
  return `${formatUsd(cents)} / mo`;
}

export function isAttentionStatus(status: string) {
  return (ownerAttentionStatuses as readonly string[]).includes(status);
}

export function isAttentionWebhook(type: string) {
  return (ownerAttentionWebhookTypes as readonly string[]).includes(type);
}
