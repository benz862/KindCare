"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireCareTeam, requireMemberHome } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type HelpFormState = {
  error?: string;
  message?: string;
};

export async function sendHelpAlert(): Promise<HelpFormState> {
  const context = await requireMemberHome();
  const supabase = await createClient();
  const { error } = await supabase.from("help_alerts").insert({
    household_id: context.membership.household.id,
    member_profile_id: context.userId,
    status: "open",
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/home");
  revalidatePath("/today");
  return {
    message:
      "KindCare told your household that you asked for help. KindCare did not call emergency services.",
  };
}

export async function acknowledgeHelpAlert(formData: FormData) {
  const context = await requireCareTeam();
  const alertId = String(formData.get("alertId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("help_alerts")
    .update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: context.userId,
    })
    .eq("id", alertId)
    .eq("household_id", context.membership.household.id)
    .eq("status", "open");

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidatePath("/today");
  revalidatePath("/home");
}
