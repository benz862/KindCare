"use client";

import { useActionState } from "react";

import { requestOwnerSignIn, type AuthFormState } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const initial: AuthFormState = {};

export function OwnerSignInForm({ next = "/owner" }: { next?: string }) {
  const [state, action, pending] = useActionState(requestOwnerSignIn, initial);

  return (
    <form action={action} className="grid gap-4">
      <input name="next" type="hidden" value={next} />
      <Field label="Email">
        <Input name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Open owner dashboard"}
      </Button>
    </form>
  );
}
