"use client";

import { useActionState } from "react";

import {
  acknowledgeHandoff,
  createHandoff,
  markHandoffAssignment,
  type HandoffFormState,
} from "@/app/handoff-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";

const initial: HandoffFormState = {};

export function HandoffForm({
  people,
}: {
  people: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createHandoff, initial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="What changed today?">
        <Textarea
          name="body"
          required
          maxLength={2000}
          placeholder="Who visited, what was finished, and what still needs a person."
        />
      </Field>
      <Field label="Assignment (optional)">
        <Input name="assignmentTitle" maxLength={80} placeholder="Pick up groceries" />
      </Field>
      <Field label="Assign to (optional)">
        <Select name="assignedTo" defaultValue="">
          <option value="">Anyone on the care team</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
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
        {pending ? "Saving…" : "Share with the care team"}
      </Button>
    </form>
  );
}

export function AcknowledgeHandoffButton({ handoffId }: { handoffId: string }) {
  return (
    <form action={acknowledgeHandoff}>
      <input name="handoffId" type="hidden" value={handoffId} />
      <Button type="submit" variant="secondary" size="compact">
        I read this
      </Button>
    </form>
  );
}

export function CompleteAssignmentButton({ assignmentId }: { assignmentId: string }) {
  return (
    <form action={markHandoffAssignment}>
      <input name="assignmentId" type="hidden" value={assignmentId} />
      <Button type="submit" variant="secondary" size="compact">
        Mark done
      </Button>
    </form>
  );
}
