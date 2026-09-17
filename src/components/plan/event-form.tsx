"use client";

import { useActionState } from "react";

import { createCalendarEvent, type PlanFormState } from "@/app/calendar-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { calendarKindLabels } from "@/lib/plan-copy";

const initial: PlanFormState = {};

export function EventForm({
  people,
}: {
  people: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createCalendarEvent, initial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="What is this?">
        <Input name="title" required maxLength={80} placeholder="Pharmacy visit" />
      </Field>
      <Field label="Kind">
        <Select name="kind" defaultValue="appointment" required>
          {Object.entries(calendarKindLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="When">
        <Input name="startsAt" type="datetime-local" required />
      </Field>
      <Field label="Ends (optional)">
        <Input name="endsAt" type="datetime-local" />
      </Field>
      <label className="flex items-center gap-3 text-sm font-normal text-ink">
        <input name="allDay" type="checkbox" />
        All day
      </label>
      <Field label="Who is it for? (optional)">
        <Select name="assignedTo" defaultValue="">
          <option value="">Whole household</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Notes (optional)">
        <Textarea name="notes" maxLength={2000} />
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
        {pending ? "Saving…" : "Add to calendar"}
      </Button>
    </form>
  );
}
