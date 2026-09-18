"use client";

import { useActionState } from "react";

import { createCalendarEvent, saveAppointmentPrep, type PlanFormState } from "@/app/calendar-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import type { AppointmentPrep } from "@/lib/plan";
import { calendarKindLabels } from "@/lib/plan-copy";

const initial: PlanFormState = {};

function PrepFields({ prep }: { prep?: AppointmentPrep | null }) {
  return (
    <div className="grid gap-4 rounded-2xl bg-mist px-4 py-4">
      <p className="text-sm leading-6 text-navy/75">
        Appointment preparation stays in the household. KindCare does not write clinical summaries
        or tell anyone what to ask a clinician.
      </p>
      <Field label="Questions to remember">
        <Textarea name="questions" maxLength={2000} defaultValue={prep?.questions ?? ""} />
      </Field>
      <Field label="Documents to bring">
        <Textarea
          name="documentsToBring"
          maxLength={2000}
          defaultValue={prep?.documentsToBring ?? ""}
        />
      </Field>
      <Field label="Transport plan">
        <Textarea name="transportPlan" maxLength={2000} defaultValue={prep?.transportPlan ?? ""} />
      </Field>
      <Field label="Follow-up tasks">
        <Textarea name="followUpTasks" maxLength={2000} defaultValue={prep?.followUpTasks ?? ""} />
      </Field>
    </div>
  );
}

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
      <PrepFields />
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

export function AppointmentPrepForm({
  eventId,
  prep,
}: {
  eventId: string;
  prep?: AppointmentPrep | null;
}) {
  const [state, action, pending] = useActionState(saveAppointmentPrep, initial);

  return (
    <form action={action} className="mt-3 grid gap-3">
      <input name="eventId" type="hidden" value={eventId} />
      <PrepFields prep={prep} />
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
      <Button type="submit" variant="secondary" size="compact" disabled={pending}>
        {pending ? "Saving…" : "Save appointment notes"}
      </Button>
    </form>
  );
}

export function AppointmentPrepReadout({
  prep,
  size = "care",
}: {
  prep?: AppointmentPrep | null;
  size?: "care" | "member";
}) {
  if (!prep) return null;
  const rows = [
    ["Questions to remember", prep.questions],
    ["Documents to bring", prep.documentsToBring],
    ["Transport plan", prep.transportPlan],
    ["Follow-up tasks", prep.followUpTasks],
  ].filter(([, value]) => value);
  if (rows.length === 0) return null;

  return (
    <div className="mt-3 grid gap-2">
      {rows.map(([label, value]) => (
        <p key={label} className={size === "member" ? "text-base leading-7 text-ink/80" : "text-sm leading-6 text-ink/80"}>
          <span className="font-semibold text-navy">{label}: </span>
          {value}
        </p>
      ))}
    </div>
  );
}
