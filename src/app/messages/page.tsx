import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { CancelDeliveryButton } from "@/components/messages/cancel-delivery-button";
import { ComposeNote } from "@/components/messages/compose-note";
import { VoicePlayer } from "@/components/messages/voice-player";
import { Card } from "@/components/ui/card";
import { requireCareTeam } from "@/lib/auth/session";
import { runDueDeliveries, signedVoiceUrl } from "@/lib/connection";
import { brand } from "@/lib/copy";
import { isHouseholdRole, roleLabels } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { formatWhen } from "@/lib/time";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const context = await requireCareTeam();
  await runDueDeliveries();
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const timeZone = context.membership.household.timezone;

  const [{ data: members }, { data: profiles }, { data: deliveries }, { data: voiceNotes }] =
    await Promise.all([
    supabase
      .from("household_members")
      .select("profile_id, role")
      .eq("household_id", householdId)
      .eq("status", "active"),
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("scheduled_deliveries")
      .select("id, deliver_at, status, listened_at, recurrence, voice_note_id")
      .eq("household_id", householdId)
      .neq("status", "canceled")
      .order("deliver_at", { ascending: false })
      .limit(40),
    supabase
      .from("voice_notes")
      .select(
        "id, title, body_text, storage_path, duration_seconds, author_id, recipient_id, created_at",
      )
      .eq("household_id", householdId),
  ]);

  const profileName = (id: string) =>
    (profiles ?? []).find((profile) => profile.id === id)?.display_name ?? "KindCare member";

  const recipients = (members ?? []).map((member) => {
    const role = isHouseholdRole(member.role) ? member.role : "helper";
    return {
      id: member.profile_id,
      name: profileName(member.profile_id),
      roleLabel: roleLabels[role],
    };
  });

  const notes = await Promise.all(
    (deliveries ?? []).map(async (delivery) => {
      const note = (voiceNotes ?? []).find((item) => item.id === delivery.voice_note_id);
      if (!note) return null;
      return {
        delivery,
        note,
        signedUrl: await signedVoiceUrl(note.storage_path),
      };
    }),
  );

  return (
    <AppShell
      displayName={context.displayName}
      role={context.membership.role}
      householdName={context.membership.household.name}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">MESSAGES</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Leave a warm note</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        Record a short voice note, add a written version if you like, and send it now or
        schedule it for later. Scheduled notes stay hidden until their delivery time.
      </p>

      <div className="mt-8 grid gap-5">
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">New note</h2>
          <div className="mt-5">
            <ComposeNote householdId={householdId} recipients={recipients} />
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Sent and scheduled</h2>
          {notes.filter(Boolean).length === 0 ? (
            <p className="mt-2 leading-7 text-ink/75">No notes yet.</p>
          ) : (
            <ul className="mt-4 grid gap-5">
              {notes.map((item) => {
                if (!item) return null;
                const { delivery, note, signedUrl } = item;
                const scheduled = delivery.status === "scheduled";
                return (
                  <li key={delivery.id} className="rounded-2xl bg-mist px-4 py-4">
                    <VoicePlayer
                      title={note.title || "Voice note"}
                      sender={profileName(note.author_id)}
                      whenLabel={`${scheduled ? "Arrives" : "Arrived"} ${formatWhen(delivery.deliver_at, timeZone)}`}
                      signedUrl={signedUrl}
                      transcript={note.body_text}
                      deliveryId={delivery.id}
                      listened={Boolean(delivery.listened_at)}
                    />
                    <p className="mt-3 text-sm text-navy/70">
                      For {profileName(note.recipient_id)}
                      {scheduled ? " · not delivered yet" : ""}
                      {delivery.recurrence !== "none" ? ` · repeats ${delivery.recurrence}` : ""}
                    </p>
                    {scheduled ? (
                      <div className="mt-2">
                        <CancelDeliveryButton deliveryId={delivery.id} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
      <p className="mt-8 text-sm leading-6 text-navy/70">{brand.safety}</p>
    </AppShell>
  );
}
