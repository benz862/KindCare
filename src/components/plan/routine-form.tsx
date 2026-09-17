"use client";

import { useActionState } from "react";

import { createRoutine, type PlanFormState } from "@/app/plan-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { recurrenceLabels, routineKindLabels, weekdayLabels } from "@/lib/plan-copy";

const initial: PlanFormState = {};

export function RoutineForm({
  people,
}: {
  people: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createRoutine, initial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="What would you like to remember?">
        <Input name="title" required maxLength={80} placeholder="Afternoon walk" />
      </Field>
      <Field label="Kind">
        <Select name="kind" defaultValue="task" required>
          {Object.entries(routineKindLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Who is it for?">
        <Select name="assignedTo" required defaultValue={people[0]?.id}>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="When?">
        <Input name="localTime" type="time" required />
      </Field>
      <Field label="Start on">
        <Input name="startOn" type="date" required />
      </Field>
      <Field label="End on (optional)">
        <Input name="endOn" type="date" />
      </Field>
      <Field label="How often?">
        <Select name="recurrence" defaultValue="none" required>
          {Object.entries(recurrenceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold text-ink">Days (optional)</legend>
        <div className="flex flex-wrap gap-3">
          {weekdayLabels.map((day) => (
            <label key={day.value} className="flex items-center gap-2 text-sm font-normal text-ink">
              <input name="daysOfWeek" type="checkbox" value={day.value} />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="How should KindCare follow up?">
        <Select name="followUp" defaultValue="none">
          <option value="none">No extra notice</option>
          <option value="notify_caregiver">Tell the care team if help is needed</option>
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
        {pending ? "Saving…" : "Save reminder"}
      </Button>
    </form>
  );
}
