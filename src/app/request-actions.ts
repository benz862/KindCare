"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireCareTeam, requireHousehold } from "@/lib/auth/session";
import { firstIssue, memberRequestSchema, requestPresetSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type RequestFormState = {
  error?: string;
  message?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createMemberRequest(
  _: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const choice = formValue(formData, "choice");
  const [kindFromChoice, ...labelParts] = choice.split("::");
  const parsed = memberRequestSchema.safeParse({
    kind: kindFromChoice || formValue(formData, "kind"),
    label: labelParts.join("::") || formValue(formData, "label") || undefined,
    message: formValue(formData, "message") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireHousehold();
  if (context.membership.role !== "member") {
    return { error: "One-tap requests are for the person KindCare supports." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("member_requests").insert({
    household_id: context.membership.household.id,
    member_profile_id: context.userId,
    kind: parsed.data.kind,
    label: parsed.data.label || null,
    message: parsed.data.message || null,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/home");
  revalidatePath("/today");
  revalidatePath("/notices");
  return { message: "Your household was told. KindCare did not call anyone." };
}

export async function resolveMemberRequest(formData: FormData) {
  const context = await requireCareTeam();
  const requestId = formValue(formData, "requestId");
  const supabase = await createClient();
  const { error } = await supabase
    .from("member_requests")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: context.userId,
    })
    .eq("id", requestId)
    .eq("household_id", context.membership.household.id)
    .eq("status", "open");

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidatePath("/today");
  revalidatePath("/home");
  revalidatePath("/notices");
}

export async function createRequestPreset(
  _: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const parsed = requestPresetSchema.safeParse({
    label: formValue(formData, "label"),
    kind: formValue(formData, "kind"),
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  if (context.membership.role === "helper") {
    return { error: "Trusted helpers can see requests, but not change the buttons." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("request_presets").insert({
    household_id: context.membership.household.id,
    created_by: context.userId,
    label: parsed.data.label,
    kind: parsed.data.kind,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/plan");
  revalidatePath("/home");
  return { message: "That request button is ready on Home." };
}

export async function deactivateRequestPreset(formData: FormData) {
  const context = await requireCareTeam();
  if (context.membership.role === "helper") {
    throw new Error("Trusted helpers can see requests, but not change the buttons.");
  }
  const presetId = formValue(formData, "presetId");
  const supabase = await createClient();
  const { error } = await supabase
    .from("request_presets")
    .update({ active: false })
    .eq("id", presetId)
    .eq("household_id", context.membership.household.id);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidatePath("/plan");
  revalidatePath("/home");
}
