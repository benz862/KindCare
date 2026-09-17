import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { HelpPanel, TalkPanel } from "@/components/member/connection-panels";
import { VoicePlayer } from "@/components/messages/voice-player";
import { DayItemList } from "@/components/plan/day-item-list";
import { RequestForm } from "@/components/plan/request-form";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { requireMemberHome } from "@/lib/auth/session";
import { runDueDeliveries, signedVoiceUrl } from "@/lib/connection";
import { loadRangeItems } from "@/lib/plan";
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

  const [{ data: deliveries }, { data: notes }, { data: contacts }, { data: profiles }, { data: alerts }, { byDay }, { data: notices }] =
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
      supabase
        .from("help_alerts")
        .select("id, created_at, status")
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
          <h2 className="font-serif text-3xl font-semibold text-navy">Ask the household</h2>
          <p className="mt-3 text-lg leading-8 text-ink/75">
            Need a call, a ride, or groceries? This tells people in your household. KindCare does
            not call anyone for you.
          </p>
          <div className="mt-5">
            <RequestForm size="member" />
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
          openAlert={alerts?.[0] ? { createdAt: alerts[0].created_at } : null}
        />
      </div>
    </AppShell>
  );
}
