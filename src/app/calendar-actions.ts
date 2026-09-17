"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireCareTeam } from "@/lib/auth/session";
import { canEditCalendar } from "@/lib/roles";
import { calendarEventSchema, firstIssue } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { localInputToIso } from "@/lib/time";

export type PlanFormState = {
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

export async function createCalendarEvent(
  _: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const parsed = calendarEventSchema.safeParse({
    title: formValue(formData, "title"),
    kind: formValue(formData, "kind"),
    startsAt: formValue(formData, "startsAt"),
    endsAt: formValue(formData, "endsAt") || undefined,
    allDay: formData.get("allDay") === "on",
    assignedTo: formValue(formData, "assignedTo") || undefined,
    notes: formValue(formData, "notes") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  if (!canEditCalendar(context.membership.role)) {
    return { error: "You can look at the calendar, but not add items." };
  }

  const startsAt = localInputToIso(parsed.data.startsAt);
  const endsAt = parsed.data.endsAt ? localInputToIso(parsed.data.endsAt) : null;
  if (!startsAt) {
    return { error: "Choose a valid start time." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").insert({
    household_id: context.membership.household.id,
    created_by: context.userId,
    title: parsed.data.title,
    kind: parsed.data.kind,
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: parsed.data.allDay,
    assigned_to: parsed.data.assignedTo || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidateCoordination();
  return { message: "Calendar item saved." };
}

export async function deleteCalendarEvent(formData: FormData) {
  const context = await requireCareTeam();
  if (context.membership.role === "helper") {
    throw new Error("Trusted helpers can add calendar items, but only organizers and caregivers can remove them.");
  }

  const eventId = formValue(formData, "eventId");
  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("household_id", context.membership.household.id);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidateCoordination();
}

export async function markCalendarTask(formData: FormData) {
  const context = await requireCareTeam();
  const eventId = formValue(formData, "eventId");
  const status = formValue(formData, "status") === "done" ? "done" : "open";
  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("household_id", context.membership.household.id);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidateCoordination();
}
