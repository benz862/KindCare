"use client";

import { useActionState } from "react";

import { createInvitation, type HouseholdFormState } from "@/app/household-actions";
import { CopyLink } from "@/components/household/copy-link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import type { HouseholdRole } from "@/lib/roles";

const initial: HouseholdFormState = {};

export function InviteForm({ role }: { role: HouseholdRole }) {
  const [state, action, pending] = useActionState(createInvitation, initial);
  const canInviteCaregiver = role === "organizer";

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
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create invitation"}
      </Button>
    </form>
  );
}
