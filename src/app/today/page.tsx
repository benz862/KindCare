import type { Metadata } from "next";
import Link from "next/link";

import { BillingBanner } from "@/components/billing/billing-banner";
import { AcknowledgeHelpButton } from "@/components/household/acknowledge-help-button";
import {
  AcknowledgeHandoffButton,
  CompleteAssignmentButton,
  HandoffForm,
} from "@/components/household/handoff-form";
import { AppShell } from "@/components/layout/app-shell";
import { DayItemList } from "@/components/plan/day-item-list";
import { ResolveRequestButton } from "@/components/plan/plan-buttons";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { requireCareTeam } from "@/lib/auth/session";
import { loadHouseholdSubscription } from "@/lib/billing/subscription";
import { runDueDeliveries } from "@/lib/connection";
import { brand } from "@/lib/copy";
import { loadHouseholdPeople, loadRangeItems, nextOpenItem } from "@/lib/plan";
import { requestKindLabels, wellbeingFeelingLabels } from "@/lib/plan-copy";
import { canManagePlan } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { formatClock, formatWhen, ymdInZone } from "@/lib/time";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const context = await requireCareTeam();
  await runDueDeliveries();
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const timeZone = context.membership.household.timezone;
  const supported = context.membership.household.supportedPersonName ?? "the person you support";
  const today = ymdInZone(new Date(), timeZone);
  const canEdit = canManagePlan(context.membership.role);

  const [{ byDay }, { data: deliveries }, { data: notes }, { data: alerts }, { data: profiles }, { data: requests }, { data: notices }, subscription] =
    await Promise.all([
      loadRangeItems(supabase, householdId, timeZone, today, today),
      supabase
        .from("scheduled_deliveries")
        .select("id, deliver_at, status, listened_at, recurrence, voice_note_id")
        .eq("household_id", householdId)
        .neq("status", "canceled")
        .order("deliver_at")
        .limit(50),
      supabase
        .from("voice_notes")
        .select("id, title, body_text, author_id, recipient_id")
        .eq("household_id", householdId),
      supabase
        .from("help_alerts")
        .select("id, created_at, status, member_profile_id, summary")
        .eq("household_id", householdId)
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, display_name"),
      supabase
        .from("member_requests")
        .select("id, kind, label, message, created_at, member_profile_id, status")
        .eq("household_id", householdId)
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      supabase
        .from("in_app_notifications")
        .select("id")
        .eq("profile_id", context.userId)
        .is("read_at", null),
      loadHouseholdSubscription(supabase, householdId),
    ]);
  const [{ data: checkins }, { data: handoffs }, { data: assignments }, { data: acks }, people] =
    await Promise.all([
      supabase
        .from("wellbeing_checkins")
        .select("id, feeling, note, created_at, member_profile_id")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("handoffs")
        .select("id, body, author_id, created_at")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("handoff_assignments")
        .select("id, handoff_id, title, assigned_to, done")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false }),
      supabase
        .from("handoff_acks")
        .select("handoff_id, profile_id")
        .eq("household_id", householdId),
      loadHouseholdPeople(supabase, householdId),
    ]);

  const profileName = (id: string) =>
    (profiles ?? []).find((profile) => profile.id === id)?.display_name ?? "KindCare member";
  const noteFrom = (voiceNoteId: string) =>
    (notes ?? []).find((note) => note.id === voiceNoteId);

  const dayItems = byDay(today);
  const nextItem = nextOpenItem(dayItems);
  const recent = (deliveries ?? [])
    .filter((item) => item.status === "delivered")
    .sort((a, b) => new Date(b.deliver_at).getTime() - new Date(a.deliver_at).getTime())[0];
  const unread = notices?.length ?? 0;
  const latestCheckin = checkins?.[0] ?? null;

  return (
    <AppShell
      displayName={context.displayName}
      role={context.membership.role}
      householdName={context.membership.household.name}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">TODAY</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">
        A calm view for {context.membership.household.name}
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        {supported} has {dayItems.length === 0
          ? "a quiet day on the plan."
          : dayItems.length === 1
            ? "one planned item today."
            : `${dayItems.length} planned items today.`}
        {unread ? ` You have ${unread} unread notice${unread === 1 ? "" : "s"}.` : ""}
      </p>

      <div className="mt-8 grid gap-5">
        <BillingBanner
          organizer={context.membership.role === "organizer"}
          subscription={subscription}
        />
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Today’s check-in</h2>
          {latestCheckin ? (
            <p className="mt-2 leading-7 text-ink/75">
              {profileName(latestCheckin.member_profile_id)} said{" "}
              {wellbeingFeelingLabels[latestCheckin.feeling as keyof typeof wellbeingFeelingLabels] ??
                latestCheckin.feeling}{" "}
              {formatWhen(latestCheckin.created_at, timeZone)}. This is a communication prompt, not a
              health assessment.
              {latestCheckin.note ? ` “${latestCheckin.note}”` : ""}
            </p>
          ) : (
            <p className="mt-2 leading-7 text-ink/75">
              No check-in yet today. KindCare is not monitoring anyone.
            </p>
          )}
        </Card>
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">What changed today</h2>
          <p className="mt-2 leading-7 text-ink/75">
            A short handoff for helpers. This is household coordination, not a clinical record.
          </p>
          {(handoffs ?? []).length === 0 ? (
            <p className="mt-4 leading-7 text-ink/75">No handoff notes yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {(handoffs ?? []).map((handoff) => {
                const assignment = (assignments ?? []).find((item) => item.handoff_id === handoff.id);
                const readers = (acks ?? [])
                  .filter((ack) => ack.handoff_id === handoff.id)
                  .map((ack) => profileName(ack.profile_id));
                const acknowledged = (acks ?? []).some(
                  (ack) => ack.handoff_id === handoff.id && ack.profile_id === context.userId,
                );
                return (
                  <li key={handoff.id} className="rounded-2xl bg-mist px-4 py-3">
                    <p className="text-sm text-navy/70">
                      {profileName(handoff.author_id)} · {formatWhen(handoff.created_at, timeZone)}
                    </p>
                    <p className="mt-2 leading-7 text-ink">{handoff.body}</p>
                    {assignment ? (
                      <p className="mt-2 text-sm text-navy/80">
                        Assignment: {assignment.title}
                        {assignment.assigned_to ? ` · ${profileName(assignment.assigned_to)}` : ""}
                        {assignment.done ? " · done" : " · still open"}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-navy/70">
                      {readers.length ? `Read by ${readers.join(", ")}.` : "No one has acknowledged this yet."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {acknowledged ? null : <AcknowledgeHandoffButton handoffId={handoff.id} />}
                      {assignment && !assignment.done ? (
                        <CompleteAssignmentButton assignmentId={assignment.id} />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-5">
            <HandoffForm people={people.filter((person) => person.role !== "member")} />
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Next planned item</h2>
          {nextItem ? (
            <p className="mt-2 leading-7 text-ink/75">
              {nextItem.title} at {formatClock(nextItem.at, timeZone)}.
            </p>
          ) : (
            <p className="mt-2 leading-7 text-ink/75">
              Nothing is scheduled yet. You can send a note or add a reminder.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href="/messages">Send a note</ButtonLink>
            <ButtonLink href="/plan" variant="secondary">
              Add a reminder
            </ButtonLink>
            <ButtonLink href="/calendar" variant="secondary">
              Open calendar
            </ButtonLink>
            <ButtonLink href="/moments" variant="secondary">
              Family moments
            </ButtonLink>
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Day timeline</h2>
          <DayItemList
            items={dayItems}
            timeZone={timeZone}
            empty="No medication times, reminders, appointments, or notes are on today."
            canEditEvents
            showCaregiverNote={canEdit}
            canStopRoutines={canEdit}
          />
        </Card>
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Recent connection</h2>
          {recent ? (
            <p className="mt-2 leading-7 text-ink/75">
              {noteFrom(recent.voice_note_id)?.title || "A voice note"}{" "}
              {recent.listened_at
                ? `was listened to ${formatWhen(recent.listened_at, timeZone)}.`
                : `arrived ${formatWhen(recent.deliver_at, timeZone)} and has not been marked listened yet.`}
            </p>
          ) : (
            <p className="mt-2 leading-7 text-ink/75">
              No delivered notes yet. Send one from Messages when you are ready.
            </p>
          )}
        </Card>
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Open help alerts</h2>
          {(alerts ?? []).length === 0 ? (
            <p className="mt-2 leading-7 text-ink/75">There are no help alerts right now.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {(alerts ?? []).map((alert) => (
                <li
                  key={alert.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3"
                >
                  <p className="leading-7 text-ink/80">
                    {profileName(alert.member_profile_id)} asked for help{" "}
                    {formatWhen(alert.created_at, timeZone)}. KindCare did not dispatch emergency
                    services.
                    {alert.summary ? ` ${alert.summary}` : ""}
                  </p>
                  <AcknowledgeHelpButton alertId={alert.id} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Household requests</h2>
          {(requests ?? []).length === 0 ? (
            <p className="mt-2 leading-7 text-ink/75">There are no open requests.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {(requests ?? []).map((request) => (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-navy">
                      {profileName(request.member_profile_id)} ·{" "}
                      {request.label ||
                        requestKindLabels[request.kind as keyof typeof requestKindLabels] ||
                        request.kind}
                    </p>
                    {request.message ? <p className="leading-7 text-ink/75">{request.message}</p> : null}
                    <p className="text-sm text-navy/70">{formatWhen(request.created_at, timeZone)}</p>
                  </div>
                  <ResolveRequestButton requestId={request.id} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <p className="mt-8 text-sm leading-6 text-navy/70">
        {brand.safety}{" "}
        <Link className="font-semibold underline-offset-4 hover:underline" href="/people">
          Review people
        </Link>
        {unread ? (
          <>
            {" "}
            ·{" "}
            <Link className="font-semibold underline-offset-4 hover:underline" href="/notices">
              Read notices
            </Link>
          </>
        ) : null}
      </p>
    </AppShell>
  );
}
