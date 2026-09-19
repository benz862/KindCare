import { NextResponse } from "next/server";

import { askOpenAI } from "@/lib/companion";
import { patientScope, requireHousehold } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await requireHousehold();
  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1200) : "";
  if (!message) return NextResponse.json({ error: "Say or type a message first." }, { status: 400 });

  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const patientId = patientScope(context).patient_id;
  const [{ data: medications }, { data: upcoming }] = await Promise.all([
    supabase
      .from("medication_plans")
      .select("name, strength_label, amount_text, times, reminder_text")
      .eq("household_id", householdId)
      .eq("patient_id", patientId)
      .eq("member_profile_id", context.userId)
      .eq("active", true),
    supabase
      .from("calendar_events")
      .select("title, starts_at")
      .eq("household_id", householdId)
      .eq("patient_id", patientId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(3),
  ]);

  try {
    const result = await askOpenAI(message, {
      memberName: context.displayName,
      timeZone: context.membership.household.timezone,
      medications: (medications ?? []).map((item) => ({
        name: item.name,
        strength: item.strength_label,
        amount: item.amount_text,
        times: item.times,
        reminder: item.reminder_text,
      })),
      upcoming: (upcoming ?? []).map((item) => ({ title: item.title, at: item.starts_at })),
    });

    const [{ error: memberMessageError }, { error: companionMessageError }] = await Promise.all([
      supabase.from("companion_messages").insert({
        household_id: householdId,
        patient_id: patientId,
        member_profile_id: context.userId,
        role: "member",
        content: message,
      }),
      supabase.from("companion_messages").insert({
        household_id: householdId,
        patient_id: patientId,
        member_profile_id: context.userId,
        role: "companion",
        content: result.reply,
        caregiver_summary: result.caregiverSummary,
        needs_attention: result.needsAttention,
      }),
    ]);
    if (memberMessageError || companionMessageError) {
      throw new Error("The conversation could not be saved.");
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Companion service could not respond.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
