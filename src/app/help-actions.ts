"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { patientScope, requireCareTeam, requireMemberHome } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type HelpFormState = {
  error?: string;
  message?: string;
  createdAt?: string;
};

function helpSummary(householdName: string, contactNames: string[]) {
  const people =
    contactNames.length > 0
      ? ` People listed for you to call: ${contactNames.join(", ")}.`
      : "";
  return `KindCare told ${householdName} in the app. KindCare did not call 911 or anyone.${people}`;
}

export async function sendHelpAlert(): Promise<HelpFormState> {
  const context = await requireMemberHome();
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const householdName = context.membership.household.name;
  const scope = patientScope(context);

  const { data: existing, error: existingError } = await supabase
    .from("help_alerts")
    .select("id, summary, created_at")
    .eq("household_id", householdId)
    .eq("patient_id", scope.patient_id)
    .eq("member_profile_id", context.userId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { error: friendlyDatabaseError(existingError.message) };
  }

  if (existing) {
    return {
      message:
        existing.summary ?? helpSummary(householdName, []),
      createdAt: existing.created_at,
    };
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("name, is_emergency, include_in_talk")
    .eq("household_id", householdId)
    .eq("patient_id", scope.patient_id)
    .order("name");

  const contactNames = (contacts ?? [])
    .filter((contact) => contact.is_emergency || contact.include_in_talk)
    .map((contact) => contact.name);
  const summary = helpSummary(householdName, contactNames);

  const { data: inserted, error } = await supabase
    .from("help_alerts")
    .insert({
      household_id: householdId,
      patient_id: scope.patient_id,
      member_profile_id: context.userId,
      status: "open",
      summary,
    })
    .select("created_at")
    .single();

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/home");
  revalidatePath("/today");
  revalidatePath("/notices");
  return {
    message: summary,
    createdAt: inserted.created_at,
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
    .eq("patient_id", context.activePatient.id)
    .eq("status", "open");

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidatePath("/today");
  revalidatePath("/home");
  revalidatePath("/notices");
}
