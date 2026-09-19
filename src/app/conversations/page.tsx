import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireCareTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatWhen } from "@/lib/time";

export const metadata: Metadata = { title: "Conversations" };

export default async function ConversationsPage() {
  const context = await requireCareTeam();
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const [{ data: messages }, { data: profiles }] = await Promise.all([
    supabase
      .from("companion_messages")
      .select("id, member_profile_id, role, content, caregiver_summary, needs_attention, created_at")
      .eq("household_id", householdId)
      .eq("patient_id", context.activePatient.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("id, display_name"),
  ]);
  const memberName = (id: string) => profiles?.find((profile) => profile.id === id)?.display_name ?? "Member";

  return (
    <AppShell displayName={context.displayName} role={context.membership.role} householdName={context.membership.household.name}>
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">CONVERSATIONS</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">KindCare Companion updates</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        A respectful record of what the member chose to share with KindCare Companion. This is not medical monitoring or an emergency service.
      </p>
      <div className="mt-8 grid gap-5">
        {(messages ?? []).length === 0 ? <Card><p className="leading-7 text-ink/75">No companion conversations have been saved yet.</p></Card> : null}
        {(messages ?? []).map((message) => (
          <Card key={message.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy">{memberName(message.member_profile_id)} · {message.role === "member" ? "said" : "KindCare Companion replied"}</p>
              {message.needs_attention ? <span className="rounded-full bg-spark/15 px-3 py-1 text-sm font-semibold text-ink">May need follow-up</span> : null}
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-ink/80">{message.content}</p>
            {message.caregiver_summary ? <p className="mt-3 rounded-2xl bg-mist p-3 text-sm leading-6 text-navy"><span className="font-semibold">Caregiver summary: </span>{message.caregiver_summary}</p> : null}
            <p className="mt-3 text-sm text-navy/65">{formatWhen(message.created_at, context.membership.household.timezone)}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
