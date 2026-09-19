"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireCareTeam } from "@/lib/auth/session";
import { canManagePlan } from "@/lib/roles";
import { firstIssue, medicationPlanSchema, routineSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type PlanFormState = {
  error?: string;
  message?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function selectedDays(formData: FormData) {
  return formData
    .getAll("daysOfWeek")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
}

function selectedTimes(formData: FormData) {
  return ["time1", "time2", "time3", "time4", "time5", "time6"]
    .map((key) => formValue(formData, key).trim())
    .filter(Boolean);
}

function revalidateCoordination() {
  revalidatePath("/today");
  revalidatePath("/home");
  revalidatePath("/calendar");
  revalidatePath("/plan");
  revalidatePath("/notices");
}

export async function createRoutine(
  _: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const parsed = routineSchema.safeParse({
    title: formValue(formData, "title"),
    kind: formValue(formData, "kind"),
    assignedTo: formValue(formData, "assignedTo"),
    localTime: formValue(formData, "localTime"),
    startOn: formValue(formData, "startOn"),
    endOn: formValue(formData, "endOn") || undefined,
    recurrence: formValue(formData, "recurrence"),
    daysOfWeek: selectedDays(formData),
    notes: formValue(formData, "notes") || undefined,
    followUp: formValue(formData, "followUp") || "none",
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  if (!canManagePlan(context.membership.role)) {
    return { error: "Organizers and caregivers can add reminders." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("routines").insert({
    household_id: context.membership.household.id,
    patient_id: context.activePatient.id,
    created_by: context.userId,
    assigned_to: parsed.data.assignedTo,
    title: parsed.data.title,
    kind: parsed.data.kind,
    notes: parsed.data.notes || null,
    local_time: parsed.data.localTime,
    start_on: parsed.data.startOn,
    end_on: parsed.data.endOn || null,
    recurrence: parsed.data.recurrence,
    days_of_week: parsed.data.daysOfWeek,
    follow_up: parsed.data.followUp,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  await supabase.rpc("materialize_plan_items");
  revalidateCoordination();
  return { message: "Reminder saved. It will show on the days you chose." };
}

export async function deactivateRoutine(formData: FormData) {
  const context = await requireCareTeam();
  if (!canManagePlan(context.membership.role)) {
    throw new Error("Organizers and caregivers can change reminders.");
  }

  const routineId = formValue(formData, "routineId");
  const supabase = await createClient();
  const { error } = await supabase
    .from("routines")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", routineId)
    .eq("household_id", context.membership.household.id);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidateCoordination();
}

export async function createMedicationPlan(
  _: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const parsed = medicationPlanSchema.safeParse({
    name: formValue(formData, "name"),
    strengthLabel: formValue(formData, "strengthLabel"),
    amountText: formValue(formData, "amountText"),
    reminderText: formValue(formData, "reminderText") || undefined,
    refillNote: formValue(formData, "refillNote") || undefined,
    memberProfileId: formValue(formData, "memberProfileId"),
    times: selectedTimes(formData),
    startOn: formValue(formData, "startOn"),
    endOn: formValue(formData, "endOn") || undefined,
    daysOfWeek: selectedDays(formData),
    notifyOrganizer: formData.get("notifyOrganizer") === "on",
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  if (!canManagePlan(context.membership.role)) {
    return { error: "Organizers and caregivers can add medication plans." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("medication_plans").insert({
    household_id: context.membership.household.id,
    patient_id: context.activePatient.id,
    created_by: context.userId,
    member_profile_id: parsed.data.memberProfileId,
    name: parsed.data.name,
    strength_label: parsed.data.strengthLabel,
    amount_text: parsed.data.amountText,
    reminder_text: parsed.data.reminderText || null,
    refill_note: parsed.data.refillNote || null,
    times: parsed.data.times,
    days_of_week: parsed.data.daysOfWeek,
    start_on: parsed.data.startOn,
    end_on: parsed.data.endOn || null,
    notify_organizer: parsed.data.notifyOrganizer,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  await supabase.rpc("materialize_plan_items");
  revalidateCoordination();
  return {
    message:
      "Medication plan saved from the details you entered. KindCare will remind, not advise.",
  };
}

export async function deactivateMedicationPlan(formData: FormData) {
  const context = await requireCareTeam();
  if (!canManagePlan(context.membership.role)) {
    throw new Error("Organizers and caregivers can change medication plans.");
  }

  const planId = formValue(formData, "planId");
  const supabase = await createClient();
  const { error } = await supabase
    .from("medication_plans")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("household_id", context.membership.household.id);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidateCoordination();
}
