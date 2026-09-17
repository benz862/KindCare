"use server";

import { redirect } from "next/navigation";

import { getAppUrl, safeNextPath } from "@/lib/app-url";
import { friendlyAuthError } from "@/lib/auth/errors";
import { resolveSignedInPath } from "@/lib/auth/session";
import {
  emailSchema,
  firstIssue,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  message?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function requestSignIn(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formValue(formData, "email").trim(),
    password: formValue(formData, "password"),
    next: formValue(formData, "next") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  redirect(await resolveSignedInPath(safeNextPath(parsed.data.next, "/today")));
}

export async function requestSignUp(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    displayName: formValue(formData, "displayName"),
    email: formValue(formData, "email").trim(),
    password: formValue(formData, "password"),
    next: formValue(formData, "next") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const nextPath = safeNextPath(parsed.data.next, "/onboarding");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      data: { display_name: parsed.data.displayName },
    },
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  if (data.session) {
    redirect(await resolveSignedInPath(nextPath));
  }

  return {
    message:
      "Check your email to confirm this KindCare account. If you do not see it, look in spam.",
  };
}

export async function requestPasswordReset(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse({
    email: formValue(formData, "email").trim(),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent("/update-password")}`,
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  return {
    message:
      "If that email has a KindCare account, a reset link is on the way. Check your inbox and spam folder.",
  };
}

export async function requestPasswordUpdate(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formValue(formData, "password"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  redirect(await resolveSignedInPath());
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
