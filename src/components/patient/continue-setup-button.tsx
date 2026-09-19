"use client";

import { useActionState } from "react";

import { continuePatientSetup, type PatientFormState } from "@/app/patient-actions";
import { Button } from "@/components/ui/button";

const initial: PatientFormState = {};

export function ContinueSetupButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState(continuePatientSetup, initial);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <p className="rounded-2xl bg-mist px-4 py-3 text-lg text-navy" role="status">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="member" className="min-h-20 w-full text-2xl" disabled={pending}>
        {pending ? "Please wait…" : "Continue"}
      </Button>
    </form>
  );
}
