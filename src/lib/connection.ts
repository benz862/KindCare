import { momentBucket } from "@/lib/moment-storage";
import { voiceBucket } from "@/lib/voice-storage";
import { createClient } from "@/lib/supabase/server";

export async function signedVoiceUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(voiceBucket).createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

export async function signedMomentUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(momentBucket).createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

export async function runDueDeliveries() {
  const supabase = await createClient();
  await Promise.all([
    supabase.rpc("deliver_due_voice_notes"),
    supabase.rpc("materialize_plan_items"),
  ]);
}
