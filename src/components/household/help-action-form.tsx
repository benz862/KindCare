"use client";

import { useActionState } from "react";

import { updateHelpAction, type HouseholdFormState } from "@/app/household-actions";
import { Button } from "@/components/ui/button";

const initial: HouseholdFormState = {};

export function HelpActionForm({ confirmRequired }: { confirmRequired: boolean }) {
  const [state, action, pending] = useActionState(updateHelpAction, initial);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1 text-sm font-normal text-ink">
        <span className="flex items-center gap-3">
          <input
            defaultChecked={confirmRequired}
            name="helpConfirmRequired"
            type="radio"
            value="true"
          />
          Ask for confirmation before sending a help alert
        </span>
        <span className="pl-7 text-navy/70">
          The member first sees people to call, 911, and then can send an in-app alert.
        </span>
      </label>
      <label className="grid gap-1 text-sm font-normal text-ink">
        <span className="flex items-center gap-3">
          <input
            defaultChecked={!confirmRequired}
            name="helpConfirmRequired"
            type="radio"
            value="false"
          />
          One tap sends a help alert
        </span>
        <span className="pl-7 text-navy/70">
          The first tap tells the household in KindCare. It still does not call 911.
        </span>
      </label>
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
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Saving…" : "Save help action"}
      </Button>
    </form>
  );
}
