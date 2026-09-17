"use client";

import { useActionState } from "react";

import { createMemberRequest, type RequestFormState } from "@/app/request-actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { requestKindLabels } from "@/lib/plan-copy";

const initial: RequestFormState = {};

export function RequestForm({ size = "default" }: { size?: "default" | "member" }) {
  const [state, action, pending] = useActionState(createMemberRequest, initial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="What would help?">
        <Select name="kind" defaultValue="call_me" required className={size === "member" ? "min-h-14 text-lg" : undefined}>
          {Object.entries(requestKindLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Anything to add? (optional)">
        <Textarea name="message" maxLength={500} className={size === "member" ? "text-lg" : undefined} />
      </Field>
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
      <Button type="submit" size={size === "member" ? "member" : "default"} disabled={pending}>
        {pending ? "Sending…" : "Ask the household"}
      </Button>
    </form>
  );
}
