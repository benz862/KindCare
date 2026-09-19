"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireCareTeam } from "@/lib/auth/session";
import { firstIssue, handoffSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type HandoffFormState = {
  error?: string;
  message?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function revalidateHandoff() {
  revalidatePath("/today");
  revalidatePath("/notices");
}

export async function createHandoff(
  _: HandoffFormState,
  formData: FormData,
): Promise<HandoffFormState> {
  const parsed = handoffSchema.safeParse({
    body: formValue(formData, "body"),
    assignmentTitle: formValue(formData, "assignmentTitle") || undefined,
    assignedTo: formValue(formData, "assignedTo") || undefined,
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  const householdId = context.membership.household.id;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("handoffs")
    .insert({
      household_id: householdId,
      patient_id: context.activePatient.id,
      author_id: context.userId,
      body: parsed.data.body,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: friendlyDatabaseError(error?.message) };
  }

  if (parsed.data.assignmentTitle) {
    const { error: assignmentError } = await supabase.from("handoff_assignments").insert({
      household_id: householdId,
      patient_id: context.activePatient.id,
      handoff_id: data.id,
      title: parsed.data.assignmentTitle,
      assigned_to: parsed.data.assignedTo || null,
    });
    if (assignmentError) {
      return { error: friendlyDatabaseError(assignmentError.message) };
    }
  }

  revalidateHandoff();
  return { message: "The household care team can see what changed today." };
}

export async function acknowledgeHandoff(formData: FormData) {
  const context = await requireCareTeam();
  const handoffId = formValue(formData, "handoffId");
  const supabase = await createClient();
  const { error } = await supabase.from("handoff_acks").upsert(
    {
      handoff_id: handoffId,
      household_id: context.membership.household.id,
      patient_id: context.activePatient.id,
      profile_id: context.userId,
    },
    { onConflict: "handoff_id,profile_id" },
  );

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidateHandoff();
}

export async function markHandoffAssignment(formData: FormData) {
  const context = await requireCareTeam();
  const assignmentId = formValue(formData, "assignmentId");
  const supabase = await createClient();
  const { error } = await supabase
    .from("handoff_assignments")
    .update({
      done: true,
      done_at: new Date().toISOString(),
      done_by: context.userId,
    })
    .eq("id", assignmentId)
    .eq("household_id", context.membership.household.id)
    .eq("done", false);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidateHandoff();
}
