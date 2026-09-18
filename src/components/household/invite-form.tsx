"use client";

import { useActionState } from "react";

import { createInvitation, type HouseholdFormState } from "@/app/household-actions";
import { CopyLink } from "@/components/household/copy-link";
import { CopyText } from "@/components/household/copy-text";
import { Button, ButtonAnchor } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { invitationMailto, invitationMessage } from "@/lib/mail-copy";
import { isInviteRole, roleLabels, type HouseholdRole } from "@/lib/roles";

const initial: HouseholdFormState = {};

export function InviteForm({
  role,
  householdName,
  fromName,
}: {
  role: HouseholdRole;
  householdName: string;
  fromName: string;
}) {
  const [state, action, pending] = useActionState(createInvitation, initial);
  const canInviteCaregiver = role === "organizer";
  const inviteRole =
    state.inviteRole && isInviteRole(state.inviteRole) ? state.inviteRole : "helper";
  const roleLabel = roleLabels[inviteRole];
  const mail =
    state.inviteUrl && state.inviteEmail
      ? invitationMessage({
          householdName,
          roleLabel,
          inviteUrl: state.inviteUrl,
          fromName,
        })
      : null;
  const mailto =
    state.inviteUrl && state.inviteEmail
      ? invitationMailto({
          email: state.inviteEmail,
          householdName,
          roleLabel,
          inviteUrl: state.inviteUrl,
          fromName,
        })
      : null;

  return (
    <form action={action} className="grid gap-4">
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Role">
        <Select name="role" defaultValue="helper" required>
          {canInviteCaregiver ? <option value="caregiver">Caregiver</option> : null}
          <option value="helper">Trusted helper</option>
          <option value="member">Member</option>
        </Select>
      </Field>
      {state.error ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {state.message}
        </p>
      ) : null}
      {state.inviteUrl ? <CopyLink url={state.inviteUrl} /> : null}
      {mailto && mail ? (
        <div className="grid gap-3">
          <ButtonAnchor href={mailto} variant="secondary">
            Open in Mail
          </ButtonAnchor>
          <CopyText
            value={`Subject: ${mail.subject}\n\n${mail.body}`}
            label="Copy invitation email"
          />
        </div>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create invitation"}
      </Button>
    </form>
  );
}
