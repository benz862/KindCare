"use client";

import { useActionState } from "react";

import { createMedicationPlan, type PlanFormState } from "@/app/plan-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { brand } from "@/lib/copy";
import { weekdayLabels } from "@/lib/plan-copy";

const initial: PlanFormState = {};

export function MedicationForm({
  people,
}: {
  people: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createMedicationPlan, initial);

  return (
    <form action={action} className="grid gap-4">
      <p className="rounded-2xl bg-mist px-4 py-3 text-sm leading-6 text-navy/80">{brand.medication}</p>
      <Field label="Medication name from the label">
        <Input name="name" required maxLength={80} />
      </Field>
      <Field label="Strength exactly as written on the label">
        <Input name="strengthLabel" required maxLength={80} placeholder="10 mg" />
      </Field>
      <Field label="Amount as written for this household">
        <Input name="amountText" required maxLength={80} placeholder="1 tablet" />
      </Field>
      <Field label="Who is it for?">
        <Select name="memberProfileId" required defaultValue={people[0]?.id}>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="First time">
        <Input name="time1" type="time" required />
      </Field>
      <Field label="Second time (optional)">
        <Input name="time2" type="time" />
      </Field>
      <Field label="Third time (optional)">
        <Input name="time3" type="time" />
      </Field>
      <Field label="Start on">
        <Input name="startOn" type="date" required />
      </Field>
      <Field label="End on (optional)">
        <Input name="endOn" type="date" />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold text-ink">Days (leave blank for every day in the date range)</legend>
        <div className="flex flex-wrap gap-3">
          {weekdayLabels.map((day) => (
            <label key={day.value} className="flex items-center gap-2 text-sm font-normal text-ink">
              <input name="daysOfWeek" type="checkbox" value={day.value} />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Plain-language reminder (optional)">
        <Textarea name="reminderText" maxLength={500} placeholder="Take with breakfast, as written on the label." />
      </Field>
      <Field label="Refill note (optional)">
        <Textarea name="refillNote" maxLength={500} />
      </Field>
      <label className="flex items-center gap-3 text-sm font-normal text-ink">
        <input defaultChecked name="notifyOrganizer" type="checkbox" />
        Tell the care team when this plan is added or changed
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
        {pending ? "Saving…" : "Save medication plan"}
      </Button>
    </form>
  );
}
