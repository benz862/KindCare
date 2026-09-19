import { createServiceClient } from "@/lib/supabase/admin";
import {
  countByStatus,
  estimatedMrrCents,
  formatMrr,
  isAttentionStatus,
  isAttentionWebhook,
  planLabel,
  planMix,
  stripeDashboardUrl,
} from "@/lib/owner/metrics";

function sinceDays(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function loadOwnerDashboard() {
  const supabase = createServiceClient();
  const seven = sinceDays(7);
  const thirty = sinceDays(30);
  const livemode = !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test");

  const [
    households,
    newHouseholds7,
    newHouseholds30,
    accounts,
    newAccounts7,
    newAccounts30,
    patients,
    caregiverAssignments,
    patientAssignments,
    subscriptions,
    webhookEvents,
  ] = await Promise.all([
    supabase.from("households").select("id", { count: "exact", head: true }),
    supabase.from("households").select("id", { count: "exact", head: true }).gte("created_at", seven),
    supabase.from("households").select("id", { count: "exact", head: true }).gte("created_at", thirty),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", seven),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirty),
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase
      .from("patient_assignments")
      .select("profile_id")
      .eq("status", "active")
      .in("role", ["primary", "backup_primary", "caregiver"]),
    supabase.from("patient_assignments").select("id", { count: "exact", head: true }).eq("status", "active").eq("role", "patient"),
    supabase
      .from("subscriptions")
      .select(
        "household_id, status, stripe_price_id, stripe_subscription_id, stripe_customer_id, cancel_at_period_end, current_period_end, updated_at",
      ),
    supabase
      .from("stripe_webhook_events")
      .select("id, type, created_at, household_id, stripe_object_id, livemode")
      .in("type", [
        "invoice.payment_failed",
        "invoice.payment_action_required",
        "customer.subscription.deleted",
      ])
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const householdIds = [
    ...new Set(
      [
        ...(subscriptions.data ?? []).map((row) => row.household_id),
        ...(webhookEvents.data ?? []).map((row) => row.household_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
  const { data: householdRows } = householdIds.length
    ? await supabase.from("households").select("id, name").in("id", householdIds)
    : { data: [] as { id: string; name: string }[] };
  const householdName = (id: string | null) =>
    (householdRows ?? []).find((row) => row.id === id)?.name ?? "Unknown household";

  const subRows = (subscriptions.data ?? []).map((row) => ({
    status: row.status,
    stripePriceId: row.stripe_price_id,
    cancelAtPeriodEnd: row.cancel_at_period_end,
  }));
  const statusCounts = countByStatus(subRows);
  const caregiverCount = new Set((caregiverAssignments.data ?? []).map((row) => row.profile_id)).size;

  const upcomingCancellations = (subscriptions.data ?? [])
    .filter((row) => row.cancel_at_period_end && row.status !== "canceled")
    .sort((a, b) => Date.parse(a.current_period_end ?? "") - Date.parse(b.current_period_end ?? ""))
    .map((row) => ({
      householdName: householdName(row.household_id),
      status: row.status,
      periodEnd: row.current_period_end,
      dashboardUrl: row.stripe_subscription_id
        ? stripeDashboardUrl({ livemode, kind: "subscriptions", id: row.stripe_subscription_id })
        : null,
    }));

  const attentionFromStatus = (subscriptions.data ?? [])
    .filter((row) => isAttentionStatus(row.status))
    .map((row) => ({
      key: `sub-${row.household_id}`,
      householdName: householdName(row.household_id),
      reason: row.status.replaceAll("_", " "),
      timestamp: row.updated_at,
      dashboardUrl: row.stripe_subscription_id
        ? stripeDashboardUrl({ livemode, kind: "subscriptions", id: row.stripe_subscription_id })
        : row.stripe_customer_id
          ? stripeDashboardUrl({ livemode, kind: "customers", id: row.stripe_customer_id })
          : null,
    }));

  const attentionFromWebhooks = (webhookEvents.data ?? [])
    .filter((row) => isAttentionWebhook(row.type))
    .map((row) => ({
      key: row.id,
      householdName: householdName(row.household_id),
      reason: row.type.replaceAll(".", " "),
      timestamp: row.created_at,
      dashboardUrl: row.stripe_object_id
        ? stripeDashboardUrl({
            livemode: row.livemode ?? livemode,
            kind: row.type.startsWith("invoice.") ? "invoices" : "events",
            id: row.stripe_object_id,
          })
        : stripeDashboardUrl({ livemode: row.livemode ?? livemode, kind: "events", id: row.id }),
    }));

  const seen = new Set<string>();
  const attentionQueue = [...attentionFromStatus, ...attentionFromWebhooks]
    .filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    })
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  return {
    kpis: {
      households: households.count ?? 0,
      accounts: accounts.count ?? 0,
      caregivers: caregiverCount,
      patients: patients.count ?? patientAssignments.count ?? 0,
      newAccounts7: newAccounts7.count ?? 0,
      newAccounts30: newAccounts30.count ?? 0,
      newHouseholds7: newHouseholds7.count ?? 0,
      newHouseholds30: newHouseholds30.count ?? 0,
      subscriptions: statusCounts,
      planMix: planMix(subRows),
      mrrLabel: formatMrr(estimatedMrrCents(subRows)),
    },
    upcomingCancellations,
    attentionQueue,
    subscriptions: (subscriptions.data ?? []).map((row) => ({
      householdName: householdName(row.household_id),
      plan: planLabel(row.stripe_price_id),
      status: row.status,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      periodEnd: row.current_period_end,
      dashboardUrl: row.stripe_subscription_id
        ? stripeDashboardUrl({ livemode, kind: "subscriptions", id: row.stripe_subscription_id })
        : null,
    })),
  };
}

export type OwnerDashboard = Awaited<ReturnType<typeof loadOwnerDashboard>>;
