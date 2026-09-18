"use client";

import { useActionState } from "react";

import { createRequestPreset, deactivateRequestPreset, type RequestFormState } from "@/app/request-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { requestKindLabels } from "@/lib/plan-copy";

const initial: RequestFormState = {};

export function RequestPresetForm() {
  const [state, action, pending] = useActionState(createRequestPreset, initial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Button name">
        <Input name="label" required maxLength={80} placeholder="Please pick up the mail" />
      </Field>
      <Field label="Closest match">
        <Select name="kind" defaultValue="something_else" required>
          {Object.entries(requestKindLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add a request button"}
      </Button>
    </form>
  );
}

export function RemovePresetButton({ presetId }: { presetId: string }) {
  return (
    <form action={deactivateRequestPreset}>
      <input name="presetId" type="hidden" value={presetId} />
      <Button type="submit" variant="ghost" size="compact">
        Hide this button
      </Button>
    </form>
  );
}
