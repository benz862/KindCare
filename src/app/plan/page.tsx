import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { MedicationForm } from "@/components/plan/medication-form";
import { RequestPresetForm, RemovePresetButton } from "@/components/plan/request-preset-form";
import { RoutineForm } from "@/components/plan/routine-form";
import { StopPlanButton, StopRoutineButton } from "@/components/plan/plan-buttons";
import { Card } from "@/components/ui/card";
import { requireCareTeam } from "@/lib/auth/session";
import { runDueDeliveries } from "@/lib/connection";
import { brand } from "@/lib/copy";
import { loadHouseholdPeople } from "@/lib/plan";
import { recurrenceLabels, requestKindLabels, routineKindLabels, weekdayLabels } from "@/lib/plan-copy";
import { canManagePlan } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanPage() {
  const context = await requireCareTeam();
  await runDueDeliveries();
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const canEdit = canManagePlan(context.membership.role);
  const people = await loadHouseholdPeople(supabase, householdId);
  const nameFor = (id: string) => people.find((person) => person.id === id)?.name ?? "KindCare member";

  const [{ data: routines }, { data: plans }, { data: presets }] = await Promise.all([
    supabase
      .from("routines")
      .select("id, title, kind, local_time, recurrence, days_of_week, start_on, end_on, assigned_to, active, notes")
      .eq("household_id", householdId)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("medication_plans")
      .select(
        "id, name, strength_label, amount_text, times, days_of_week, start_on, end_on, member_profile_id, reminder_text, refill_note, active",
      )
      .eq("household_id", householdId)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("request_presets")
      .select("id, label, kind, active")
      .eq("household_id", householdId)
      .eq("active", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell
      displayName={context.displayName}
      role={context.membership.role}
      householdName={context.membership.household.name}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">PLAN</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Routines and medication plan</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        Reminders help the day stay gentle. Medication details come from the prescription label or
        a clinician-approved list. KindCare does not calculate doses or say whether medicine was taken.
      </p>

      <div className="mt-8 grid gap-5">
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Reminders</h2>
          {(routines ?? []).length === 0 ? (
            <p className="mt-2 leading-7 text-ink/75">No repeating reminders yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {(routines ?? []).map((routine) => (
                <li key={routine.id} className="rounded-2xl bg-mist px-4 py-3">
                  <p className="font-semibold text-navy">{routine.title}</p>
                  <p className="text-sm text-navy/70">
                    {routineKindLabels[routine.kind as keyof typeof routineKindLabels] ?? routine.kind} ·{" "}
                    {recurrenceLabels[routine.recurrence as keyof typeof recurrenceLabels] ?? routine.recurrence} ·{" "}
                    {String(routine.local_time).slice(0, 5)} · for {nameFor(routine.assigned_to)}
                    {routine.days_of_week?.length
                      ? ` · ${routine.days_of_week
                          .map((day) => weekdayLabels.find((item) => item.value === day)?.label)
                          .filter(Boolean)
                          .join(", ")}`
                      : ""}
                  </p>
                  {canEdit ? (
                    <div className="mt-2">
                      <StopRoutineButton routineId={routine.id} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <div className="mt-6">
              <RoutineForm people={people} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-navy/70">Trusted helpers can see reminders and mark them on Today.</p>
          )}
        </Card>

        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Medication plans</h2>
          <p className="mt-2 leading-7 text-ink/75">{brand.medication}</p>
          {(plans ?? []).length === 0 ? (
            <p className="mt-4 leading-7 text-ink/75">No medication plans are saved yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {(plans ?? []).map((plan) => (
                <li key={plan.id} className="rounded-2xl bg-mist px-4 py-3">
                  <p className="font-semibold text-navy">{plan.name}</p>
                  <p className="text-sm text-navy/70">
                    {plan.strength_label} · {plan.amount_text} · for {nameFor(plan.member_profile_id)} ·{" "}
                    {plan.times.map((time) => String(time).slice(0, 5)).join(", ")}
                  </p>
                  {plan.reminder_text ? <p className="mt-1 text-sm text-ink/75">{plan.reminder_text}</p> : null}
                  {canEdit ? (
                    <div className="mt-2">
                      <StopPlanButton planId={plan.id} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <div className="mt-6">
              <MedicationForm people={people} />
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">One-tap request buttons</h2>
          <p className="mt-2 leading-7 text-ink/75">
            Home already includes Please call me, I need groceries, I need a ride, and I need help
            with something. Extra buttons you add here appear on the member home.
          </p>
          {(presets ?? []).length === 0 ? (
            <p className="mt-4 leading-7 text-ink/75">No extra buttons yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {(presets ?? []).map((preset) => (
                <li key={preset.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3">
                  <p className="font-semibold text-navy">
                    {preset.label}
                    <span className="ml-2 text-sm font-normal text-navy/70">
                      {requestKindLabels[preset.kind as keyof typeof requestKindLabels] ?? preset.kind}
                    </span>
                  </p>
                  {canEdit ? <RemovePresetButton presetId={preset.id} /> : null}
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <div className="mt-6">
              <RequestPresetForm />
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}
