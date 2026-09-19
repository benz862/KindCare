"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getAppUrl } from "@/lib/app-url";
import { friendlyDatabaseError } from "@/lib/auth/errors";
import {
  PATIENT_COOKIE,
  getHouseholdContext,
  requireCareTeam,
  resolveSignedInPath,
} from "@/lib/auth/session";
import { patientSetupMessage, randomPatientEmail } from "@/lib/patient-setup";
import { firstIssue, patientSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PatientFormState = {
  error?: string;
  message?: string;
  setupUrl?: string;
  setupPhone?: string;
  setupSms?: string;
  patientName?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function oneTimePassword() {
  return `Kc.${randomBytes(24).toString("base64url")}`;
}

export async function setActivePatient(formData: FormData) {
  const context = await requireCareTeam();
  const patientId = formValue(formData, "patientId");
  if (!context.patients.some((patient) => patient.id === patientId)) {
    return;
  }
  (await cookies()).set(PATIENT_COOKIE, patientId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}

export async function createPatient(
  _: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const parsed = patientSchema.safeParse({
    displayName: formValue(formData, "displayName"),
    phone: formValue(formData, "phone") || undefined,
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_patient", {
    p_household_id: context.membership.household.id,
    p_display_name: parsed.data.displayName,
    p_phone: parsed.data.phone || undefined,
  });

  if (error || !data) {
    return { error: friendlyDatabaseError(error?.message) };
  }

  (await cookies()).set(PATIENT_COOKIE, data, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/people");
  revalidatePath("/today");
  return { message: `${parsed.data.displayName} was added. Send a setup link to their phone next.` };
}

export async function createPatientSetupInvite(
  _: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const patientId = formValue(formData, "patientId");
  const phone = formValue(formData, "phone") || undefined;
  const context = await requireCareTeam();
  const patient = context.patients.find((item) => item.id === patientId);
  if (!patient) {
    return { error: "Choose a care recipient you can access." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_patient_setup_invite", {
    p_patient_id: patientId,
    p_phone: phone,
  });

  if (error || !data) {
    return { error: friendlyDatabaseError(error?.message) };
  }

  const setupUrl = `${getAppUrl()}/setup/${data}`;
  const setupSms = patientSetupMessage({
    patientName: patient.displayName,
    caregiverName: context.displayName,
    setupUrl,
  });

  revalidatePath("/people");
  return {
    message:
      "Setup link created. It works once and expires in 7 days. KindCare does not send SMS; copy it or open Messages.",
    setupUrl,
    setupPhone: phone || patient.phone || undefined,
    setupSms,
    patientName: patient.displayName,
  };
}

export async function revokePatientSetupInvite(formData: FormData) {
  await requireCareTeam();
  const inviteId = formValue(formData, "inviteId");
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_patient_setup_invite", {
    p_invite_id: inviteId,
  });
  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }
  revalidatePath("/people");
}

export async function setBackupPrimary(formData: FormData) {
  const context = await requireCareTeam();
  if (context.activePatient.role !== "primary") {
    throw new Error("Only the primary caregiver can name a backup.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_patient_backup_primary", {
    p_patient_id: context.activePatient.id,
    p_profile_id: formValue(formData, "profileId"),
  });
  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }
  revalidatePath("/people");
}

export async function continuePatientSetup(
  _: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const token = formValue(formData, "token");
  if (!token) {
    return { error: "This setup link is not valid." };
  }

  const userClient = await createClient();
  const { data: previewRows } = await userClient.rpc("preview_patient_setup", { p_token: token });
  const preview = previewRows?.[0];
  if (!preview) {
    return { error: "This setup link is expired, used, or was revoked. Ask your caregiver for a new one." };
  }

  const context = await getHouseholdContext();
  if (context) {
    const { error } = await userClient.rpc("accept_patient_setup", { p_token: token });
    if (error) {
      return { error: friendlyDatabaseError(error.message) };
    }
    redirect(`/setup/${token}/device`);
  }

  const admin = createServiceClient();
  const { data: patient } = await admin
    .from("patients")
    .select("id, display_name, member_profile_id")
    .eq("id", preview.patient_id)
    .maybeSingle();

  if (!patient) {
    return { error: "KindCare could not finish this setup. Ask your caregiver for a new link." };
  }

  const password = oneTimePassword();
  let email: string;

  if (patient.member_profile_id) {
    const existing = await admin.auth.admin.getUserById(patient.member_profile_id);
    const existingEmail = existing.data.user?.email;
    if (!existing.data.user || !existingEmail) {
      return { error: "KindCare could not open this account on a new phone. Ask your caregiver for a new link." };
    }
    email = existingEmail;
    try {
      await admin.auth.admin.signOut(existing.data.user.id, "global");
    } catch {
      // Password rotation still invalidates the old shared-secret path.
    }
    const updated = await admin.auth.admin.updateUserById(existing.data.user.id, { password });
    if (updated.error) {
      return { error: "KindCare could not prepare this phone. Please try again." };
    }
  } else {
    email = randomPatientEmail(patient.id);
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: patient.display_name },
    });
    if (created.error || !created.data.user) {
      return { error: friendlyDatabaseError(created.error?.message) };
    }
  }

  const { error: signInError } = await userClient.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: "KindCare could not sign you in on this phone. Please try the link again." };
  }

  const { error: acceptError } = await userClient.rpc("accept_patient_setup", { p_token: token });
  if (acceptError) {
    return { error: friendlyDatabaseError(acceptError.message) };
  }

  redirect(`/setup/${token}/device`);
}

export async function finishPatientDeviceSetup() {
  redirect(await resolveSignedInPath("/home"));
}
