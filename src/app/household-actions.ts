"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAppUrl } from "@/lib/app-url";
import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireCareTeam, requireSession, resolveSignedInPath } from "@/lib/auth/session";
import { firstIssue, householdSchema, invitationSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type HouseholdFormState = {
  error?: string;
  message?: string;
  inviteUrl?: string;
  inviteEmail?: string;
  inviteRole?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createHousehold(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const parsed = householdSchema.safeParse({
    name: formValue(formData, "name"),
    supportedPersonName: formValue(formData, "supportedPersonName") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireSession();
  if (context.membership) {
    redirect("/today");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("households").insert({
    name: parsed.data.name,
    supported_person_name: parsed.data.supportedPersonName || null,
    created_by: context.userId,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  redirect("/today");
}

export async function updateHousehold(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const parsed = householdSchema.safeParse({
    name: formValue(formData, "name"),
    supportedPersonName: formValue(formData, "supportedPersonName") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  if (context.membership.role !== "organizer") {
    return { error: "Only the household organizer can change this." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("households")
    .update({
      name: parsed.data.name,
      supported_person_name: parsed.data.supportedPersonName || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.membership.household.id);

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/settings");
  revalidatePath("/today");
  return { message: "Household details were saved." };
}

export async function createInvitation(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const parsed = invitationSchema.safeParse({
    email: formValue(formData, "email").trim(),
    role: formValue(formData, "role"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_invitation", {
    p_household_id: context.membership.household.id,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/people");
  return {
    message:
      "Invitation created. KindCare does not send invitation email. Copy the link or open Mail from your iCloud mailbox.",
    inviteUrl: `${getAppUrl()}/invite/${data}`,
    inviteEmail: parsed.data.email,
    inviteRole: parsed.data.role,
  };
}

export async function updateHelpAction(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const context = await requireCareTeam();
  if (context.membership.role !== "organizer" && context.membership.role !== "caregiver") {
    return { error: "Only an organizer or caregiver can change the help action." };
  }

  const confirmRequired = formValue(formData, "helpConfirmRequired") !== "false";
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_help_action", {
    p_household_id: context.membership.household.id,
    p_confirm_required: confirmRequired,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/people");
  revalidatePath("/settings");
  revalidatePath("/home");
  return {
    message: confirmRequired
      ? "Help alerts now ask for confirmation first."
      : "Help alerts now send on the first tap. The member still sees 911 and people to call.",
  };
}

export async function revokeInvitation(formData: FormData) {
  await requireCareTeam();
  const invitationId = String(formData.get("invitationId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidatePath("/people");
}

export async function acceptInvitation(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  await requireSession();
  const token = String(formData.get("token") ?? "");
  if (!token) {
    return { error: "This invitation is not valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invitation", { p_token: token });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  redirect(await resolveSignedInPath());
}
