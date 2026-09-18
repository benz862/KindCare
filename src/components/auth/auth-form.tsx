"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  requestPasswordReset,
  requestPasswordUpdate,
  requestSignIn,
  requestSignUp,
  type AuthFormState,
} from "@/app/auth-actions";
import { createHousehold, updateHousehold, type HouseholdFormState } from "@/app/household-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PasskeySignIn } from "@/components/auth/passkey-controls";

const authInitial: AuthFormState = {};
const householdInitial: HouseholdFormState = {};

function Status({ state }: { state: { error?: string; message?: string } }) {
  if (state.error) {
    return (
      <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
        {state.message}
      </p>
    );
  }
  return null;
}

export function SignInForm({
  compact = false,
  next = "",
}: {
  compact?: boolean;
  next?: string;
}) {
  const [state, action, pending] = useActionState(requestSignIn, authInitial);

  return (
    <form action={action} className="grid gap-4">
      {next ? <input name="next" type="hidden" value={next} /> : null}
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={12}
          required
        />
      </Field>
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in securely"}
      </Button>
      <PasskeySignIn next={next} />
      {!compact ? (
        <p className="text-sm text-navy/75">
          New to KindCare?{" "}
          <Link
            className="font-semibold text-navy underline-offset-4 hover:underline"
            href={next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"}
          >
            Create an account
          </Link>
        </p>
      ) : null}
    </form>
  );
}

export function SignUpForm({ next = "" }: { next?: string }) {
  const [state, action, pending] = useActionState(requestSignUp, authInitial);

  return (
    <form action={action} className="grid gap-4">
      {next ? <input name="next" type="hidden" value={next} /> : null}
      <Field label="Your name">
        <Input name="displayName" autoComplete="name" required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </Field>
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create KindCare account"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, authInitial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordUpdate, authInitial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="New password">
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </Field>
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}

export function HouseholdSetupForm() {
  const [state, action, pending] = useActionState(createHousehold, householdInitial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Household name" hint="A private name your family will recognize.">
        <Input name="name" required maxLength={80} placeholder="The Rivera household" />
      </Field>
      <Field
        label="Who do you support?"
        hint="Optional. Use the name they like to be called."
      >
        <Input name="supportedPersonName" maxLength={80} />
      </Field>
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create private household"}
      </Button>
    </form>
  );
}

export function HouseholdSettingsForm({
  name,
  supportedPersonName,
}: {
  name: string;
  supportedPersonName: string | null;
}) {
  const [state, action, pending] = useActionState(updateHousehold, householdInitial);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Household name">
        <Input name="name" required maxLength={80} defaultValue={name} />
      </Field>
      <Field label="Supported person’s name">
        <Input
          name="supportedPersonName"
          maxLength={80}
          defaultValue={supportedPersonName ?? ""}
        />
      </Field>
      <Status state={state} />
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Saving…" : "Save household"}
      </Button>
    </form>
  );
}
