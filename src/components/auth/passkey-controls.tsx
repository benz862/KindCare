"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function PasskeySignIn({ next = "" }: { next?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    setMessage(null);
    const { error } = await createClient().auth.signInWithPasskey();
    if (error) {
      setMessage("Face ID or device unlock was not available. You can sign in with your password instead.");
      setPending(false);
      return;
    }
    router.replace(next || "/");
    router.refresh();
  }

  return (
    <div className="grid gap-3 border-t border-navy/10 pt-5">
      <p className="text-sm leading-6 text-navy/75">On a familiar phone, use Face ID, Touch ID, or your device unlock instead of typing a password.</p>
      <Button type="button" variant="teal" onClick={() => void signIn()} disabled={pending}>
        {pending ? "Opening device unlock…" : "Use Face ID or device unlock"}
      </Button>
      {message ? <p className="text-sm text-navy/75" role="status">{message}</p> : null}
    </div>
  );
}

export function PasskeyEnrollment() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function enroll() {
    setPending(true);
    setMessage(null);
    const { error } = await createClient().auth.registerPasskey();
    setMessage(error ? "Device unlock could not be set up. Please try again on the phone the member uses." : "Device unlock is ready on this phone.");
    setPending(false);
  }

  return <div className="grid gap-3"><Button type="button" variant="teal" onClick={() => void enroll()} disabled={pending}>{pending ? "Setting up…" : "Set up Face ID or device unlock"}</Button>{message ? <p className="text-sm text-navy/75" role="status">{message}</p> : null}</div>;
}
