import type { Metadata } from "next";

import { InviteForm } from "@/components/household/invite-form";
import { RevokeInviteButton } from "@/components/household/revoke-invite-button";
import { ContactForm } from "@/components/household/contact-form";
import { DeleteContactButton } from "@/components/household/delete-contact-button";
import { HelpActionForm } from "@/components/household/help-action-form";
import { HelpMailTemplates } from "@/components/household/help-mail-templates";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireCareTeam } from "@/lib/auth/session";
import { canManagePlan, isHouseholdRole, isInviteRole, roleLabels } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/copy";
import { phoneHref, smsHref } from "@/lib/phone";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const context = await requireCareTeam();
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const canInvite =
    context.membership.role === "organizer" || context.membership.role === "caregiver";
  const canConfigureHelp = canManagePlan(context.membership.role);
  const supported =
    context.membership.household.supportedPersonName ?? "the person you support";

  const [{ data: members }, { data: invitations }, { data: profiles }, { data: contacts }] =
    await Promise.all([
    supabase
      .from("household_members")
      .select("id, role, status, profile_id")
      .eq("household_id", householdId)
      .eq("status", "active")
      .order("created_at"),
    canInvite
      ? supabase
          .from("invitations")
          .select("id, email, role, expires_at, accepted_at, revoked_at")
          .eq("household_id", householdId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("contacts")
      .select("id, name, phone, relationship, include_in_talk, is_emergency")
      .eq("household_id", householdId)
      .order("name"),
  ]);

  const openInvites = (invitations ?? []).filter(
    (invite) => !invite.accepted_at && !invite.revoked_at,
  );

  return (
    <AppShell
      displayName={context.displayName}
      role={context.membership.role}
      householdName={context.membership.household.name}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">PEOPLE</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">
        Trusted people in {context.membership.household.name}
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        App participants are invited into this household. Contacts are people you may call
        without giving them KindCare access.
      </p>

      <div className="mt-8 grid gap-5">
        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Household members</h2>
          <ul className="mt-4 grid gap-3">
            {(members ?? []).map((member) => {
              const profile = (profiles ?? []).find((item) => item.id === member.profile_id);
              const role = isHouseholdRole(member.role) ? member.role : "helper";
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-mist px-4 py-3"
                >
                  <span className="font-semibold text-navy">
                    {profile?.display_name ?? "KindCare member"}
                    {member.profile_id === context.userId ? " (you)" : ""}
                  </span>
                  <span className="text-sm text-navy/70">{roleLabels[role]}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        {canInvite ? (
          <Card>
            <h2 className="font-serif text-2xl font-semibold text-navy">Invite someone</h2>
            <p className="mt-2 leading-7 text-ink/75">
              KindCare does not send invitation email. Copy the private link, or open Mail and send
              it from your iCloud mailbox. For product questions, write to {brand.supportEmail}.
            </p>
            <div className="mt-5">
              <InviteForm
                role={context.membership.role}
                householdName={context.membership.household.name}
                fromName={context.displayName}
              />
            </div>
          </Card>
        ) : null}

        {canInvite ? (
          <Card>
            <h2 className="font-serif text-2xl font-semibold text-navy">Open invitations</h2>
            {openInvites.length === 0 ? (
              <p className="mt-2 leading-7 text-ink/75">There are no open invitations.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {openInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-navy">{invite.email}</p>
                      <p className="text-sm text-navy/70">
                        {isInviteRole(invite.role) ? roleLabels[invite.role] : invite.role} ·
                        expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <RevokeInviteButton invitationId={invite.id} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}

        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Help action</h2>
          <p className="mt-2 leading-7 text-ink/75">
            Configure trusted contacts below, then choose whether “I need help” asks first or
            sends an in-app alert on the first tap. KindCare never calls 911 or dispatches help.
          </p>
          {canConfigureHelp ? (
            <div className="mt-5">
              <HelpActionForm
                key={String(context.membership.household.helpConfirmRequired)}
                confirmRequired={context.membership.household.helpConfirmRequired}
              />
            </div>
          ) : (
            <p className="mt-4 leading-7 text-ink/75">
              {context.membership.household.helpConfirmRequired
                ? "Help alerts currently ask for confirmation first."
                : "Help alerts currently send on the first tap."}{" "}
              An organizer or caregiver can change this.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Help messages</h2>
          <p className="mt-2 leading-7 text-ink/75">
            These templates are for your iCloud mailbox or Messages. KindCare stores in-app
            alerts only and does not send this mail for you.
          </p>
          <div className="mt-5">
            <HelpMailTemplates
              memberName={supported}
              householdName={context.membership.household.name}
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-2xl font-semibold text-navy">Contacts</h2>
          <p className="mt-2 leading-7 text-ink/75">
            These people can be called from Talk to someone and I need help. They cannot open
            this household.
          </p>
          {(contacts ?? []).length === 0 ? (
            <p className="mt-4 leading-7 text-ink/75">No contacts are saved yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {(contacts ?? []).map((contact) => {
                const href = contact.phone ? phoneHref(contact.phone) : null;
                return (
                  <li
                    key={contact.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-navy">{contact.name}</p>
                      <p className="text-sm text-navy/70">
                        {contact.relationship ? `${contact.relationship} · ` : ""}
                        {contact.phone ?? "No phone"}
                        {contact.include_in_talk ? " · Talk to someone" : ""}
                        {contact.is_emergency ? " · Help panel" : ""}
                      </p>
                      {href ? (
                        <span className="mt-1 flex gap-3">
                          <a
                            className="text-sm font-semibold text-navy underline-offset-4 hover:underline"
                            href={href}
                          >
                            Call
                          </a>
                          {contact.phone ? (
                            <a
                              className="text-sm font-semibold text-navy underline-offset-4 hover:underline"
                              href={smsHref(contact.phone) ?? undefined}
                            >
                              Text
                            </a>
                          ) : null}
                        </span>
                      ) : null}
                    </div>
                    {canInvite ? <DeleteContactButton contactId={contact.id} /> : null}
                  </li>
                );
              })}
            </ul>
          )}
          {canInvite ? (
            <div className="mt-5">
              <ContactForm />
            </div>
          ) : null}
        </Card>
      </div>
      <p className="mt-8 text-sm leading-6 text-navy/70">{brand.safety}</p>
    </AppShell>
  );
}
