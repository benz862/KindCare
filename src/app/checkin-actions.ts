"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireHousehold, requireMemberHome } from "@/lib/auth/session";
import { doseMarkSchema, firstIssue, occurrenceMarkSchema, wellbeingCheckinSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type CheckinFormState = {
  error?: string;
  message?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function revalidateCoordination() {
  revalidatePath("/today");
  revalidatePath("/home");
  revalidatePath("/calendar");
  revalidatePath("/plan");
  revalidatePath("/notices");
}

export async function markDose(formData: FormData) {
  const parsed = doseMarkSchema.safeParse({
    doseId: formValue(formData, "doseId"),
    status: formValue(formData, "status"),
    caregiverNote: formValue(formData, "caregiverNote") || undefined,
  });

  if (!parsed.success) {
    throw new Error(firstIssue(parsed.error));
  }

  const context = await requireHousehold();
  const supabase = await createClient();
  const { error } = await supabase
    .from("medication_doses")
    .update({
      status: parsed.data.status,
      marked_at: new Date().toISOString(),
      marked_by: context.userId,
      caregiver_note: parsed.data.caregiverNote || null,
    })
    .eq("id", parsed.data.doseId)
    .eq("household_id", context.membership.household.id);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidateCoordination();
}

export async function markOccurrence(formData: FormData) {
  const parsed = occurrenceMarkSchema.safeParse({
    occurrenceId: formValue(formData, "occurrenceId"),
    status: formValue(formData, "status"),
    note: formValue(formData, "note") || undefined,
  });

  if (!parsed.success) {
    throw new Error(firstIssue(parsed.error));
  }

  const context = await requireHousehold();
  const supabase = await createClient();
  const { error } = await supabase
    .from("routine_occurrences")
    .update({
      status: parsed.data.status,
      completed_at: new Date().toISOString(),
      completed_by: context.userId,
      note: parsed.data.note || null,
    })
    .eq("id", parsed.data.occurrenceId)
    .eq("household_id", context.membership.household.id);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidateCoordination();
}

export async function createWellbeingCheckin(
  _: CheckinFormState,
  formData: FormData,
): Promise<CheckinFormState> {
  const parsed = wellbeingCheckinSchema.safeParse({
    feeling: formValue(formData, "feeling"),
    note: formValue(formData, "note") || undefined,
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireMemberHome();
  const supabase = await createClient();
  const { error } = await supabase.from("wellbeing_checkins").insert({
    household_id: context.membership.household.id,
    member_profile_id: context.userId,
    feeling: parsed.data.feeling,
    note: parsed.data.note || null,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidateCoordination();
  return {
    message:
      parsed.data.feeling === "would_like_to_talk"
        ? "Your household was told you’d like to talk. KindCare is not watching you and did not call anyone."
        : "Thanks. Your household can see that you checked in. This is not a health assessment.",
  };
}
