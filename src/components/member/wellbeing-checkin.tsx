"use client";

import { useActionState } from "react";

import { createWellbeingCheckin, type CheckinFormState } from "@/app/checkin-actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { wellbeingFeelingLabels } from "@/lib/plan-copy";

const initial: CheckinFormState = {};

export function WellbeingCheckin({
  latestLabel,
}: {
  latestLabel?: string | null;
}) {
  const [state, action, pending] = useActionState(createWellbeingCheckin, initial);

  return (
    <form action={action} className="grid gap-4">
      <p className="text-lg leading-8 text-ink/75">
        How are you doing today? This tells your household. It is not a health check, and KindCare
        is not watching you.
      </p>
      {latestLabel ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-base text-navy" role="status">
          {latestLabel}
        </p>
      ) : null}
      <Field label="Anything to add? (optional)">
        <Textarea name="note" maxLength={500} className="text-lg" />
      </Field>
      <div className="grid gap-3">
        {Object.entries(wellbeingFeelingLabels).map(([value, label]) => (
          <Button
            key={value}
            type="submit"
            name="feeling"
            value={value}
            size="member"
            variant={value === "would_like_to_talk" ? "teal" : "secondary"}
            disabled={pending}
            className="w-full"
          >
            {pending ? "Sending…" : label}
          </Button>
        ))}
      </div>
      {state.error ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-base text-navy" role="status">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-base text-navy" role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
