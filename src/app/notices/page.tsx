import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { MarkNoticeReadButton } from "@/components/plan/plan-buttons";
import { Card } from "@/components/ui/card";
import { requireHousehold } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatWhen } from "@/lib/time";

export const metadata: Metadata = { title: "Notices" };

export default async function NoticesPage() {
  const context = await requireHousehold();
  const supabase = await createClient();
  const { data: notices } = await supabase
    .from("in_app_notifications")
    .select("id, title, body, href, read_at, created_at")
    .eq("profile_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <AppShell
      displayName={context.displayName}
      role={context.membership.role}
      householdName={context.membership.household.name}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">NOTICES</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">In-app notices</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        These stay inside KindCare. Email preferences are stored in Settings and are not sent yet.
      </p>
      <Card className="mt-8">
        {(notices ?? []).length === 0 ? (
          <p className="leading-7 text-ink/75">There are no notices yet.</p>
        ) : (
          <ul className="grid gap-3">
            {(notices ?? []).map((notice) => (
              <li key={notice.id} className="rounded-2xl bg-mist px-4 py-3">
                <p className="font-semibold text-navy">{notice.title}</p>
                <p className="leading-7 text-ink/75">{notice.body}</p>
                <p className="text-sm text-navy/70">
                  {formatWhen(notice.created_at, context.membership.household.timezone)}
                  {notice.read_at ? " · read" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {notice.href ? (
                    <Link className="text-sm font-semibold text-navy underline-offset-4 hover:underline" href={notice.href}>
                      Open
                    </Link>
                  ) : null}
                  {!notice.read_at ? <MarkNoticeReadButton noticeId={notice.id} /> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
