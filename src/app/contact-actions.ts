"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireCareTeam } from "@/lib/auth/session";
import { contactSchema, firstIssue } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type ContactFormState = {
  error?: string;
  message?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createContact(
  _: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    name: formValue(formData, "name"),
    phone: formValue(formData, "phone") || undefined,
    relationship: formValue(formData, "relationship") || undefined,
    includeInTalk: formData.get("includeInTalk") === "on",
    isEmergency: formData.get("isEmergency") === "on",
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  if (context.membership.role === "helper") {
    return { error: "Trusted helpers can see contacts, but not change them." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    household_id: context.membership.household.id,
    patient_id: context.activePatient.id,
    created_by: context.userId,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    relationship: parsed.data.relationship || null,
    include_in_talk: parsed.data.includeInTalk,
    is_emergency: parsed.data.isEmergency,
  });

  if (error) {
    return { error: friendlyDatabaseError(error.message) };
  }

  revalidatePath("/people");
  revalidatePath("/home");
  return { message: "Contact saved. They can be called from KindCare, and they cannot see household information." };
}

export async function deleteContact(formData: FormData) {
  const context = await requireCareTeam();
  if (context.membership.role === "helper") {
    throw new Error("Trusted helpers can see contacts, but not change them.");
  }

  const contactId = String(formData.get("contactId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("household_id", context.membership.household.id);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidatePath("/people");
  revalidatePath("/home");
}
