import type { Metadata } from "next";

import { auditOwnerAccess, requireOwner } from "@/lib/auth/require-owner";
import { loadOwnerDashboard } from "@/lib/owner/data";
import { brand } from "@/lib/copy";
import { Card } from "@/components/ui/card";
import { BrandMark } from "@/components/brand/brand-mark";
import { signOut } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Owner dashboard" };

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-mist px-4 py-5">
      <p className="text-sm font-semibold text-navy/70">{label}</p>
      <p className="mt-2 font-serif text-4xl font-semibold text-navy">{value}</p>
    </div>
  );
}

function whenLabel(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function OwnerDashboardPage() {
  const owner = await requireOwner();
  const dashboard = await loadOwnerDashboard();
  await auditOwnerAccess({
    actorProfileId: owner.userId,
    eventType: "owner.dashboard.viewed",
  });

  const status = dashboard.kpis.subscriptions;

  return (
    <div className="min-h-full bg-cloud">
      <header className="border-b border-navy/8 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <BrandMark />
            <p className="mt-1 text-sm font-semibold text-navy/70">Private owner dashboard</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="compact">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="font-serif text-4xl font-semibold text-navy">KindCare health</h1>
        <p className="mt-3 max-w-3xl leading-7 text-ink/75">
          Business snapshot only. This is not a caregiver view and does not show clinical notes,
          card numbers, or bank details.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Households" value={dashboard.kpis.households} />
          <Kpi label="Accounts" value={dashboard.kpis.accounts} />
          <Kpi label="Caregivers" value={dashboard.kpis.caregivers} />
          <Kpi label="Patients" value={dashboard.kpis.patients} />
          <Kpi label="New accounts, 7 days" value={dashboard.kpis.newAccounts7} />
          <Kpi label="New accounts, 30 days" value={dashboard.kpis.newAccounts30} />
          <Kpi label="New households, 7 days" value={dashboard.kpis.newHouseholds7} />
          <Kpi label="New households, 30 days" value={dashboard.kpis.newHouseholds30} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="Trialing" value={status.trialing} />
          <Kpi label="Active" value={status.active} />
          <Kpi label="Canceled" value={status.canceled} />
          <Kpi label="Past due" value={status.past_due} />
          <Kpi label="Unpaid" value={status.unpaid} />
          <Kpi label="Incomplete" value={status.incomplete} />
          <Kpi label="Estimated MRR" value={dashboard.kpis.mrrLabel} />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="font-serif text-2xl font-semibold text-navy">Plan mix</h2>
            {dashboard.kpis.planMix.length === 0 ? (
              <p className="mt-3 leading-7 text-ink/75">No active or trial subscriptions yet.</p>
            ) : (
              <ul className="mt-4 grid gap-2">
                {dashboard.kpis.planMix.map((plan) => (
                  <li key={plan.name} className="flex justify-between rounded-xl bg-mist px-3 py-2">
                    <span className="font-semibold text-navy">{plan.name}</span>
                    <span>{plan.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="font-serif text-2xl font-semibold text-navy">Upcoming cancellations</h2>
            {dashboard.upcomingCancellations.length === 0 ? (
              <p className="mt-3 leading-7 text-ink/75">No subscriptions are set to end at period close.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {dashboard.upcomingCancellations.map((item) => (
                  <li key={`${item.householdName}-${item.periodEnd}`} className="rounded-xl bg-mist px-3 py-3">
                    <p className="font-semibold text-navy">{item.householdName}</p>
                    <p className="text-sm text-navy/70">
                      {item.status} · ends {whenLabel(item.periodEnd)}
                    </p>
                    {item.dashboardUrl ? (
                      <a className="mt-1 inline-block text-sm font-semibold text-navy underline-offset-4 hover:underline" href={item.dashboardUrl} target="_blank" rel="noreferrer">
                        Open in Stripe
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="mt-5">
          <h2 className="font-serif text-2xl font-semibold text-navy">Payment attention</h2>
          <p className="mt-2 leading-7 text-ink/75">
            Sourced from subscription status and Stripe webhook events such as failed invoices.
            No card or bank details are stored here.
          </p>
          {dashboard.attentionQueue.length === 0 ? (
            <p className="mt-4 leading-7 text-ink/75">Nothing needs attention right now.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {dashboard.attentionQueue.map((item) => (
                <li key={item.key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3">
                  <div>
                    <p className="font-semibold text-navy">{item.householdName}</p>
                    <p className="text-sm capitalize text-navy/70">
                      {item.reason} · {whenLabel(item.timestamp)}
                    </p>
                  </div>
                  {item.dashboardUrl ? (
                    <a className="text-sm font-semibold text-navy underline-offset-4 hover:underline" href={item.dashboardUrl} target="_blank" rel="noreferrer">
                      Stripe Dashboard
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="mt-5">
          <h2 className="font-serif text-2xl font-semibold text-navy">Subscriptions</h2>
          {dashboard.subscriptions.length === 0 ? (
            <p className="mt-4 leading-7 text-ink/75">No household subscriptions yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">Subscriptions by household, plan, and status</caption>
              <thead>
                <tr className="border-b border-navy/10 text-navy/70">
                  <th className="py-2 pr-3 font-semibold">Household</th>
                  <th className="py-2 pr-3 font-semibold">Plan</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 font-semibold">Period end</th>
                  <th className="py-2 font-semibold">Stripe</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.subscriptions.map((row) => (
                  <tr key={`${row.householdName}-${row.status}-${row.periodEnd}`} className="border-b border-navy/8">
                    <td className="py-3 pr-3 font-semibold text-navy">{row.householdName}</td>
                    <td className="py-3 pr-3">{row.plan}</td>
                    <td className="py-3 pr-3 capitalize">{row.status.replaceAll("_", " ")}{row.cancelAtPeriodEnd ? " · canceling" : ""}</td>
                    <td className="py-3 pr-3">{whenLabel(row.periodEnd)}</td>
                    <td className="py-3">
                      {row.dashboardUrl ? (
                        <a className="font-semibold text-navy underline-offset-4 hover:underline" href={row.dashboardUrl} target="_blank" rel="noreferrer">
                          Dashboard
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </Card>
        <p className="mt-8 text-sm leading-6 text-navy/70">{brand.safety}</p>
      </main>
    </div>
  );
}
