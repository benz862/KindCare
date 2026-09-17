"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireCareTeam, requireHousehold } from "@/lib/auth/session";
import { firstIssue, memberRequestSchema } from "@/lib/schemas";
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
  const parsed = memberRequestSchema.safeParse({
    kind: formValue(formData, "kind"),
    message: formValue(formData, "message") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireHousehold();
  const supabase = await createClient();
  const { error } = await supabase.from("member_requests").insert({
    household_id: context.membership.household.id,
    member_profile_id: context.userId,
    kind: parsed.data.kind,
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
