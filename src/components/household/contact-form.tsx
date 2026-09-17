"use client";

import { useActionState } from "react";

import { createContact, type ContactFormState } from "@/app/contact-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const initial: ContactFormState = {};

export function ContactForm() {
  const [state, action, pending] = useActionState(createContact, initial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Name">
        <Input name="name" autoComplete="name" required maxLength={80} />
      </Field>
      <Field label="Phone" hint="Saved for calls from KindCare. This person does not get household access.">
        <Input name="phone" type="tel" autoComplete="tel" maxLength={30} />
      </Field>
      <Field label="Relationship (optional)">
        <Input name="relationship" maxLength={80} placeholder="Neighbor, sister, home aide" />
      </Field>
      <label className="flex items-center gap-3 text-sm font-normal text-ink">
        <input defaultChecked name="includeInTalk" type="checkbox" />
        Include in “Talk to someone”
      </label>
      <label className="flex items-center gap-3 text-sm font-normal text-ink">
        <input name="isEmergency" type="checkbox" />
        Show this person in the help panel
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
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save contact"}
      </Button>
    </form>
  );
}
