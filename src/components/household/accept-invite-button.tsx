"use client";

import { useActionState } from "react";

import { acceptInvitation, type HouseholdFormState } from "@/app/household-actions";
import { Button } from "@/components/ui/button";

const initial: HouseholdFormState = {};

export function AcceptInviteButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvitation, initial);

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Joining…" : "Join this household"}
      </Button>
    </form>
  );
}
