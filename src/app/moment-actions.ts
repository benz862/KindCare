"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireHousehold } from "@/lib/auth/session";
import { firstIssue, momentSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

function revalidateMoments() {
  revalidatePath("/home");
  revalidatePath("/today");
  revalidatePath("/moments");
  revalidatePath("/notices");
}

export async function createMoment(input: { body?: string; photoPath?: string }) {
  const parsed = momentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireHousehold();
  const householdId = context.membership.household.id;
  if (
    parsed.data.photoPath &&
    !parsed.data.photoPath.startsWith(`${householdId}/${context.userId}/`)
  ) {
    return { error: "That photo could not be saved." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("moments").insert({
    household_id: householdId,
    author_id: context.userId,
    body: parsed.data.body || null,
    photo_path: parsed.data.photoPath || null,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidateMoments();
  return { message: "Your moment is on the household board." };
}

export async function deleteMoment(formData: FormData) {
  const context = await requireHousehold();
  const momentId = String(formData.get("momentId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("moments")
    .delete()
    .eq("id", momentId)
    .eq("household_id", context.membership.household.id);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidateMoments();
}
