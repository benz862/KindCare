"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireHousehold } from "@/lib/auth/session";
import { firstIssue, notificationPrefSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type NoticeFormState = {
  error?: string;
  message?: string;
};

export async function updateNotificationPrefs(
  _: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = notificationPrefSchema.safeParse({
    notifyInApp: formData.get("notifyInApp") === "on",
    notifyEmail: formData.get("notifyEmail") === "on",
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireHousehold();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      notify_in_app: parsed.data.notifyInApp,
      notify_email: parsed.data.notifyEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.userId);

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/settings");
  revalidatePath("/notices");
  return {
    message: parsed.data.notifyEmail
      ? "Preference saved. KindCare stores this choice and does not send email yet."
      : "Notification preferences saved.",
  };
}

export async function markNoticeRead(formData: FormData) {
  const context = await requireHousehold();
  const noticeId = String(formData.get("noticeId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", noticeId)
    .eq("profile_id", context.userId);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidatePath("/notices");
  revalidatePath("/today");
  revalidatePath("/home");
  revalidatePath("/settings");
}
