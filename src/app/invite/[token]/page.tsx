import type { Metadata } from "next";
import Link from "next/link";

import { AcceptInviteButton } from "@/components/household/accept-invite-button";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { getHouseholdContext } from "@/lib/auth/session";
import { isInviteRole, roleLabels } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/copy";

export const metadata: Metadata = { title: "Invitation" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: preview } = await supabase.rpc("invitation_preview", { p_token: token });
  const invite = preview?.[0];
  const context = await getHouseholdContext();

  if (!invite) {
    return (
      <PageShell className="flex items-start justify-center">
        <Card className="w-full max-w-lg">
          <h1 className="font-serif text-4xl font-semibold text-navy">Invitation unavailable</h1>
          <p className="mt-3 leading-7 text-ink/75">
            This invitation is expired, revoked, or already used.
          </p>
          <ButtonLink href="/" className="mt-6">
            Return to KindCare
          </ButtonLink>
        </Card>
      </PageShell>
    );
  }

  const roleLabel = isInviteRole(invite.role) ? roleLabels[invite.role] : invite.role;
  const next = `/invite/${token}`;
  const emailMatches =
    context?.email && context.email.toLowerCase() === invite.email.toLowerCase();

  return (
    <PageShell className="flex items-start justify-center">
      <Card className="w-full max-w-lg">
        <p className="text-xs font-bold tracking-[0.16em] text-navy/60">INVITATION</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">
          Join {invite.household_name}
        </h1>
        <p className="mt-3 leading-7 text-ink/75">
          You were invited as a {roleLabel.toLowerCase()} using {invite.email}. This
          household stays private to people who are invited.
        </p>
        {context && !emailMatches ? (
          <p className="mt-4 rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
            You are signed in as {context.email}. Sign out and use {invite.email} to
            accept this invitation.
          </p>
        ) : null}
        <div className="mt-7">
          {!context ? (
            <div className="grid gap-3">
              <ButtonLink href={`/sign-in?next=${encodeURIComponent(next)}`}>
                Sign in to accept
              </ButtonLink>
              <ButtonLink href={`/sign-up?next=${encodeURIComponent(next)}`} variant="secondary">
                Create an account
              </ButtonLink>
            </div>
          ) : emailMatches ? (
            <AcceptInviteButton token={token} />
          ) : (
            <p className="text-sm text-navy/75">
              Need a different account?{" "}
              <Link className="font-semibold underline-offset-4 hover:underline" href="/settings">
                Open settings
              </Link>{" "}
              and sign out.
            </p>
          )}
        </div>
        <p className="mt-6 text-sm leading-6 text-navy/70">{brand.safety}</p>
      </Card>
    </PageShell>
  );
}
