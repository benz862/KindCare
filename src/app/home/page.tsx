import type { Metadata } from "next";

import { HelpPanel } from "@/components/member/connection-panels";
import { CompanionPanel } from "@/components/member/companion-panel";
import { AddToHomeCard } from "@/components/patient/add-to-home-card";
import { PatientShell } from "@/components/layout/patient-shell";
import { VoicePlayer } from "@/components/messages/voice-player";
import { DayItemList } from "@/components/plan/day-item-list";
import { Card } from "@/components/ui/card";
import { requireMemberHome } from "@/lib/auth/session";
import { runDueDeliveries, signedVoiceUrl } from "@/lib/connection";
import { brand } from "@/lib/copy";
import { loadRangeItems, nextOpenItem } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { formatWhen, ymdInZone } from "@/lib/time";

export const metadata: Metadata = { title: "Home" };

export default async function MemberHomePage() {
  const context = await requireMemberHome();
  await runDueDeliveries();
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const patientId = context.activePatient?.id;
  const timeZone = context.activePatient?.timezone ?? context.membership.household.timezone;
  const today = ymdInZone(new Date(), timeZone);
  const helpConfirmRequired =
    context.activePatient?.helpConfirmRequired ?? context.membership.household.helpConfirmRequired;

  const patientFilter = <T extends { eq: (column: string, value: string) => T }>(query: T) =>
    patientId ? query.eq("patient_id", patientId) : query.eq("household_id", householdId);

  const [{ data: deliveries }, { data: notes }, { data: contacts }, { data: profiles }, { data: alerts }, { items }] =
    await Promise.all([
      patientFilter(
        supabase
          .from("scheduled_deliveries")
          .select("id, deliver_at, status, listened_at, voice_note_id")
          .neq("status", "canceled")
          .lte("deliver_at", new Date().toISOString())
          .order("deliver_at", { ascending: false })
          .limit(8),
      ),
      patientFilter(supabase.from("voice_notes").select("id, title, body_text, author_id, recipient_id, storage_path")),
      patientFilter(
        supabase
          .from("contacts")
          .select("id, name, phone, relationship, include_in_talk, is_emergency")
          .order("name"),
      ),
      supabase.from("profiles").select("id, display_name"),
      patientFilter(
        supabase
          .from("help_alerts")
          .select("id, created_at, status, summary")
          .eq("member_profile_id", context.userId)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1),
      ),
      loadRangeItems(supabase, householdId, timeZone, today, today, patientId),
    ]);

  const delivered = (deliveries ?? [])
    .map((delivery) => {
      const note = (notes ?? []).find(
        (item) => item.id === delivery.voice_note_id && item.recipient_id === context.userId,
      );
      return note ? { delivery, note } : null;
    })
    .find((item) => item !== null);
  const signedUrl = delivered ? await signedVoiceUrl(delivered.note.storage_path) : null;
  const sender =
    (profiles ?? []).find((profile) => profile.id === delivered?.note.author_id)?.display_name ??
    "someone who cares about you";
  const nextItem = nextOpenItem(items);
  const contactList = (contacts ?? []).map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    relationship: contact.relationship,
    includeInTalk: contact.include_in_talk,
    isEmergency: contact.is_emergency,
  }));

  return (
    <PatientShell displayName={context.displayName}>
      <h1 className="font-serif text-4xl font-semibold text-navy">Hello, {context.displayName}</h1>
      <p className="mt-3 text-lg leading-8 text-ink/75">
        Four things, kept simple. KindCare is companionship and coordination, not medical care.
      </p>

      <div className="mt-8 grid gap-5">
        <Card>
          <CompanionPanel />
        </Card>

        <Card>
          <h2 className="font-serif text-3xl font-semibold text-navy">Next reminder</h2>
          {nextItem ? (
            <div className="mt-4">
              <DayItemList items={[nextItem]} timeZone={timeZone} empty="" size="member" />
            </div>
          ) : (
            <p className="mt-3 text-lg leading-8 text-ink/75">Nothing is scheduled right now.</p>
          )}
        </Card>

        <Card>
          {delivered ? (
            <VoicePlayer
              title={delivered.note.title || "A message for you"}
              sender={sender}
              whenLabel={formatWhen(delivered.delivery.deliver_at, timeZone)}
              signedUrl={signedUrl}
              transcript={delivered.note.body_text}
              deliveryId={delivered.delivery.id}
              listened={Boolean(delivered.delivery.listened_at)}
              size="member"
            />
          ) : (
            <>
              <h2 className="font-serif text-3xl font-semibold text-navy">Play message</h2>
              <p className="mt-3 text-lg leading-8 text-ink/75">
                When someone sends you a voice note, a large play button will be here.
              </p>
            </>
          )}
        </Card>

        <HelpPanel
          contacts={contactList}
          openAlert={
            alerts?.[0] ? { createdAt: alerts[0].created_at, summary: alerts[0].summary } : null
          }
          confirmRequired={helpConfirmRequired}
          memberName={context.displayName}
          householdName={context.activePatient?.displayName ?? context.membership.household.name}
          timeZone={timeZone}
        />

        <AddToHomeCard />
      </div>
      <p className="mt-8 text-sm leading-6 text-navy/70">{brand.safety}</p>
    </PatientShell>
  );
}
