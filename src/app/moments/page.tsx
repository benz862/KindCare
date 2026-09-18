import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ComposeMoment } from "@/components/moments/compose-moment";
import { MomentList } from "@/components/moments/moment-list";
import { Card } from "@/components/ui/card";
import { requireHousehold } from "@/lib/auth/session";
import { signedMomentUrl } from "@/lib/connection";
import { canManagePlan } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Moments" };

export default async function MomentsPage() {
  const context = await requireHousehold();
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const timeZone = context.membership.household.timezone;
  const canRemoveOthers = canManagePlan(context.membership.role);

  const [{ data: momentRows }, { data: profiles }] = await Promise.all([
    supabase
      .from("moments")
      .select("id, body, photo_path, author_id, created_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("profiles").select("id, display_name"),
  ]);

  const moments = await Promise.all(
    (momentRows ?? []).map(async (moment) => ({
      id: moment.id,
      body: moment.body,
      photoUrl: await signedMomentUrl(moment.photo_path),
      authorName:
        (profiles ?? []).find((profile) => profile.id === moment.author_id)?.display_name ??
        "Someone in the household",
      createdAt: moment.created_at,
      canDelete: moment.author_id === context.userId || canRemoveOthers,
    })),
  );

  return (
    <AppShell
      displayName={context.displayName}
      role={context.membership.role}
      householdName={context.membership.household.name}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">MOMENTS</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">Family moments</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        A private household board for warm updates, photos, and short notes. It is not a public
        social feed.
      </p>
      <div className="mt-8 grid gap-5">
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Add a moment</h2>
          <div className="mt-5">
            <ComposeMoment householdId={householdId} authorId={context.userId} />
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Household board</h2>
          <MomentList moments={moments} timeZone={timeZone} />
        </Card>
      </div>
    </AppShell>
  );
}
