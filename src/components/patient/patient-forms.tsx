"use client";

import { useActionState } from "react";

import { createPatient, createPatientSetupInvite, type PatientFormState } from "@/app/patient-actions";
import { CopyLink } from "@/components/household/copy-link";
import { CopyText } from "@/components/household/copy-text";
import { Button, ButtonAnchor } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { smsHref } from "@/lib/phone";

const initial: PatientFormState = {};

export function AddPatientForm() {
  const [state, action, pending] = useActionState(createPatient, initial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Name of the person you support">
        <Input name="displayName" autoComplete="name" required maxLength={80} />
      </Field>
      <Field label="Their phone (optional)" hint="Used so you can text the setup link. KindCare does not send SMS for you.">
        <Input name="phone" type="tel" autoComplete="tel" />
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
        {pending ? "Adding…" : "Add care recipient"}
      </Button>
    </form>
  );
}

export function PatientSetupInviteForm({
  patientId,
  patientName,
  phone,
}: {
  patientId: string;
  patientName: string;
  phone: string | null;
}) {
  const [state, action, pending] = useActionState(createPatientSetupInvite, initial);
  const sms = state.setupUrl && (state.setupPhone || phone)
    ? smsHref(state.setupPhone || phone || "", state.setupSms)
    : null;

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="patientId" value={patientId} />
      <Field label={`Phone for ${patientName}`}>
        <Input name="phone" type="tel" defaultValue={phone ?? ""} autoComplete="tel" />
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
      {state.setupUrl ? <CopyLink url={state.setupUrl} /> : null}
      {state.setupSms ? <CopyText value={state.setupSms} label="Copy text message" /> : null}
      {sms ? (
        <ButtonAnchor href={sms} variant="secondary">
          Open in Messages
        </ButtonAnchor>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create setup link"}
      </Button>
    </form>
  );
}
