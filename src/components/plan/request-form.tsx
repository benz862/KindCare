"use client";

import { useActionState } from "react";

import { createMemberRequest, type RequestFormState } from "@/app/request-actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { defaultRequestButtons } from "@/lib/plan-copy";

const initial: RequestFormState = {};

export function OneTapRequests({
  extras = [],
}: {
  extras?: { id: string; kind: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(createMemberRequest, initial);
  const buttons = [
    ...defaultRequestButtons,
    ...extras.map((item) => ({ kind: item.kind, label: item.label })),
  ];

  return (
    <form action={action} className="grid gap-4">
      <p className="text-lg leading-8 text-ink/75">
        One tap tells your household. KindCare does not call anyone or send emergency services.
      </p>
      <Field label="Anything to add? (optional)">
        <Textarea name="message" maxLength={500} className="text-lg" />
      </Field>
      <div className="grid gap-3">
        {buttons.map((button) => (
          <Button
            key={`${button.kind}-${button.label}`}
            type="submit"
            name="choice"
            value={`${button.kind}::${button.label}`}
            size="member"
            variant="secondary"
            disabled={pending}
            className="w-full"
          >
            {pending ? "Sending…" : button.label}
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
