"use server";

import { revalidatePath } from "next/cache";

import { friendlyDatabaseError } from "@/lib/auth/errors";
import { requireCareTeam, requireHousehold } from "@/lib/auth/session";
import { firstIssue, voiceNoteSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type MessageFormState = {
  error?: string;
  message?: string;
};

export async function createVoiceNote(input: unknown): Promise<MessageFormState> {
  const parsed = voiceNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const context = await requireCareTeam();
  const householdId = context.membership.household.id;
  const supabase = await createClient();

  const { data: recipient } = await supabase
    .from("household_members")
    .select("profile_id")
    .eq("household_id", householdId)
    .eq("profile_id", parsed.data.recipientId)
    .eq("status", "active")
    .maybeSingle();

  if (!recipient) {
    return { error: "Choose someone in this household." };
  }

  if (parsed.data.storagePath) {
    const allowed = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webm|m4a|mp3|ogg|wav)$/i;
    if (
      !allowed.test(parsed.data.storagePath) ||
      !parsed.data.storagePath.startsWith(`${householdId}/`)
    ) {
      return { error: "That recording could not be saved." };
    }
  }

  const deliverAt = parsed.data.sendNow
    ? new Date().toISOString()
    : parsed.data.deliverAt;
  if (!deliverAt) {
    return { error: "Choose when this note should arrive." };
  }
  if (!parsed.data.sendNow && new Date(deliverAt).getTime() <= Date.now()) {
    return { error: "Choose a future time, or send this note now." };
  }

  const { data: note, error: noteError } = await supabase
    .from("voice_notes")
    .insert({
      household_id: householdId,
      author_id: context.userId,
      recipient_id: parsed.data.recipientId,
      title: parsed.data.title || null,
      body_text: parsed.data.bodyText || null,
      storage_path: parsed.data.storagePath || null,
      duration_seconds: parsed.data.durationSeconds ?? null,
    })
    .select("id")
    .single();

  if (noteError || !note) {
    return { error: friendlyDatabaseError(noteError?.message) };
  }

  const { error: deliveryError } = await supabase.from("scheduled_deliveries").insert({
    household_id: householdId,
    voice_note_id: note.id,
    deliver_at: deliverAt,
    recurrence: parsed.data.recurrence,
    status: "scheduled",
  });

  if (deliveryError) {
    return { error: friendlyDatabaseError(deliveryError.message) };
  }

  if (parsed.data.sendNow) {
    await supabase.rpc("deliver_due_voice_notes");
  }

  revalidatePath("/messages");
  revalidatePath("/today");
  revalidatePath("/home");
  return {
    message: parsed.data.sendNow
      ? "Your note is ready for them."
      : "Your note is scheduled.",
  };
}

export async function markVoiceNoteListened(formData: FormData) {
  const context = await requireHousehold();
  const deliveryId = String(formData.get("deliveryId") ?? "");
  if (!deliveryId) return;

  const supabase = await createClient();
  const { data: delivery } = await supabase
    .from("scheduled_deliveries")
    .select("id, voice_note_id, listened_at")
    .eq("id", deliveryId)
    .maybeSingle();
  if (!delivery || delivery.listened_at) return;

  const { data: note } = await supabase
    .from("voice_notes")
    .select("recipient_id")
    .eq("id", delivery.voice_note_id)
    .maybeSingle();
  if (!note || note.recipient_id !== context.userId) return;

  const { error } = await supabase
    .from("scheduled_deliveries")
    .update({ listened_at: new Date().toISOString() })
    .eq("id", deliveryId)
    .is("listened_at", null);

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidatePath("/home");
  revalidatePath("/today");
  revalidatePath("/messages");
}

export async function cancelScheduledDelivery(formData: FormData) {
  const context = await requireCareTeam();
  const deliveryId = String(formData.get("deliveryId") ?? "");
  if (!deliveryId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("scheduled_deliveries")
    .update({ status: "canceled" })
    .eq("id", deliveryId)
    .eq("household_id", context.membership.household.id)
    .eq("status", "scheduled");

  if (error) {
    throw new Error(friendlyDatabaseError(error.message));
  }

  revalidatePath("/messages");
  revalidatePath("/today");
}
