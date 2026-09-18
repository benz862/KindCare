import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { HelpPanel, TalkPanel } from "@/components/member/connection-panels";
import { WellbeingCheckin } from "@/components/member/wellbeing-checkin";
import { VoicePlayer } from "@/components/messages/voice-player";
import { ComposeMoment } from "@/components/moments/compose-moment";
import { MomentList } from "@/components/moments/moment-list";
import { DayItemList } from "@/components/plan/day-item-list";
import { OneTapRequests } from "@/components/plan/request-form";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { requireMemberHome } from "@/lib/auth/session";
import { ComposeNote } from "@/components/messages/compose-note";
import { isHouseholdRole, roleLabels } from "@/lib/roles";
import { runDueDeliveries, signedMomentUrl, signedVoiceUrl } from "@/lib/connection";
import { loadRangeItems } from "@/lib/plan";
import { wellbeingFeelingLabels } from "@/lib/plan-copy";
import { createClient } from "@/lib/supabase/server";
import { addDaysYmd, formatWhen, ymdInZone } from "@/lib/time";

export const metadata: Metadata = { title: "Home" };

export default async function MemberHomePage() {
  const context = await requireMemberHome();
  await runDueDeliveries();
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const timeZone = context.membership.household.timezone;
  const today = ymdInZone(new Date(), timeZone);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(new Date());

  const [{ data: deliveries }, { data: notes }, { data: contacts }, { data: profiles }, { data: members }, { data: alerts }, { byDay }, { data: notices }, { data: checkins }, { data: presets }, { data: momentRows }] =
    await Promise.all([
      supabase
        .from("scheduled_deliveries")
        .select("id, deliver_at, status, listened_at, voice_note_id")
        .eq("household_id", householdId)
        .neq("status", "canceled")
        .lte("deliver_at", new Date().toISOString())
        .order("deliver_at", { ascending: false })
        .limit(10),
      supabase
        .from("voice_notes")
        .select("id, title, body_text, storage_path, author_id, recipient_id")
        .eq("household_id", householdId)
        .eq("recipient_id", context.userId),
      supabase
        .from("contacts")
        .select("id, name, phone, relationship, include_in_talk, is_emergency")
        .eq("household_id", householdId)
        .order("name"),
      supabase.from("profiles").select("id, display_name"),
      supabase.from("household_members").select("profile_id, role").eq("household_id", householdId).eq("status", "active"),
      supabase
        .from("help_alerts")
        .select("id, created_at, status, summary")
        .eq("household_id", householdId)
        .eq("member_profile_id", context.userId)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1),
      loadRangeItems(supabase, householdId, timeZone, today, addDaysYmd(today, 14)),
      supabase
        .from("in_app_notifications")
        .select("id, title")
        .eq("profile_id", context.userId)
        .is("read_at", null)
        .limit(3),
      supabase
        .from("wellbeing_checkins")
        .select("id, feeling, note, created_at")
        .eq("household_id", householdId)
        .eq("member_profile_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("request_presets")
        .select("id, kind, label")
        .eq("household_id", householdId)
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("moments")
        .select("id, body, photo_path, author_id, created_at")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const delivered = (deliveries ?? [])
    .map((delivery) => {
      const note = (notes ?? []).find((item) => item.id === delivery.voice_note_id);
      return note ? { delivery, note } : null;
    })
    .find((item) => item !== null);
  const latest = delivered ?? null;

  const signedUrl = latest ? await signedVoiceUrl(latest.note.storage_path) : null;
  const sender =
    (profiles ?? []).find((profile) => profile.id === latest?.note.author_id)?.display_name ??
    "someone who cares about you";
  const reminderItems = byDay(today)
    .filter((item) => item.source === "dose" || item.source === "routine" || item.source === "event")
    .filter((item) => !item.assignedTo || item.assignedTo === context.userId)
    .slice(0, 3);
  const replyRecipients = (members ?? [])
    .filter((member) => member.profile_id !== context.userId && member.role !== "member")
    .map((member) => {
      const role = isHouseholdRole(member.role) ? member.role : "helper";
      return { id: member.profile_id, name: (profiles ?? []).find((profile) => profile.id === member.profile_id)?.display_name ?? "Care team", roleLabel: roleLabels[role] };
    });
  const latestCheckin = checkins?.[0];
  const checkinLabel = latestCheckin
    ? `You checked in ${formatWhen(latestCheckin.created_at, timeZone)}: ${wellbeingFeelingLabels[latestCheckin.feeling as keyof typeof wellbeingFeelingLabels] ?? latestCheckin.feeling}.`
    : null;
  const moments = await Promise.all(
    (momentRows ?? []).map(async (moment) => ({
      id: moment.id,
      body: moment.body,
      photoUrl: await signedMomentUrl(moment.photo_path),
      authorName:
        (profiles ?? []).find((profile) => profile.id === moment.author_id)?.display_name ??
        "Someone in the household",
      createdAt: moment.created_at,
      canDelete: moment.author_id === context.userId,
    })),
  );

  return (
    <AppShell
      displayName={context.displayName}
      role={context.membership.role}
      householdName={context.membership.household.name}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">{dateLabel}</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">
        Hello, {context.displayName}
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-ink/75">
        This is your KindCare home. Today’s message is waiting below, if someone sent one.
      </p>

      <div className="mt-8 grid gap-5">
        <Card>
          <h2 className="font-serif text-3xl font-semibold text-navy">How are you today?</h2>
          <div className="mt-5">
            <WellbeingCheckin latestLabel={checkinLabel} />
          </div>
        </Card>
        {replyRecipients.length ? (
          <Card>
            <h2 className="font-serif text-3xl font-semibold text-navy">Leave a voice reply</h2>
            <p className="mt-3 text-lg leading-8 text-ink/75">Send a short message to someone on your care team. They can listen when they are ready.</p>
            <div className="mt-5"><ComposeNote householdId={householdId} recipients={replyRecipients} memberReply /></div>
          </Card>
        ) : null}
        <Card>
          {latest ? (
            <VoicePlayer
              title={latest.note.title || "Today’s message"}
              sender={sender}
              whenLabel={formatWhen(latest.delivery.deliver_at, timeZone)}
              signedUrl={signedUrl}
              transcript={latest.note.body_text}
              deliveryId={latest.delivery.id}
              listened={Boolean(latest.delivery.listened_at)}
              size="member"
            />
          ) : (
            <>
              <h2 className="font-serif text-3xl font-semibold text-navy">Today’s message</h2>
              <p className="mt-3 text-lg leading-8 text-ink/75">
                No voice note has arrived yet. When someone sends one, a large play button will
                be here.
              </p>
            </>
          )}
        </Card>
        <Card>
          <h2 className="font-serif text-3xl font-semibold text-navy">Today’s reminders</h2>
          <DayItemList
            items={reminderItems}
            timeZone={timeZone}
            empty="Nothing else is scheduled for today."
            size="member"
          />
          <div className="mt-5">
            <ButtonLink href="/calendar" variant="secondary" size="member">
              See today, tomorrow, and coming up
            </ButtonLink>
          </div>
        </Card>
        {(notices ?? []).length > 0 ? (
          <Card>
            <h2 className="font-serif text-3xl font-semibold text-navy">Notices</h2>
            <p className="mt-3 text-lg leading-8 text-ink/75">
              {(notices ?? [])[0]?.title}{" "}
              <ButtonLink href="/notices" variant="secondary" size="member">
                Open notices
              </ButtonLink>
            </p>
          </Card>
        ) : null}
        <Card>
          <h2 className="font-serif text-3xl font-semibold text-navy">Family moments</h2>
          <p className="mt-3 text-lg leading-8 text-ink/75">
            Warm notes and photos from your household. This is private, not a public feed.
          </p>
          <MomentList moments={moments} timeZone={timeZone} size="member" />
          <div className="mt-5">
            <ComposeMoment householdId={householdId} authorId={context.userId} size="member" />
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-3xl font-semibold text-navy">Ask the household</h2>
          <div className="mt-5">
            <OneTapRequests extras={presets ?? []} />
          </div>
        </Card>
        <TalkPanel
          contacts={(contacts ?? []).map((contact) => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship,
            includeInTalk: contact.include_in_talk,
            isEmergency: contact.is_emergency,
          }))}
        />
        <HelpPanel
          contacts={(contacts ?? []).map((contact) => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship,
            includeInTalk: contact.include_in_talk,
            isEmergency: contact.is_emergency,
          }))}
          openAlert={
            alerts?.[0]
              ? { createdAt: alerts[0].created_at, summary: alerts[0].summary }
              : null
          }
          confirmRequired={context.membership.household.helpConfirmRequired}
          memberName={context.displayName}
          householdName={context.membership.household.name}
          timeZone={timeZone}
        />
      </div>
    </AppShell>
  );
}
