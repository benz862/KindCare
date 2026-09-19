import { NextResponse } from "next/server";

import { companionInstruction } from "@/lib/companion";
import { patientScope, requireHousehold } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Keeps the OpenAI API key on the server while connecting an authenticated patient browser. */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Voice Companion is not configured yet." }, { status: 503 });

  const context = await requireHousehold();
  const offer = await request.text();
  if (!offer.trim()) return NextResponse.json({ error: "A voice connection could not be started." }, { status: 400 });

  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const patientId = patientScope(context).patient_id;
  const [{ data: medications }, { data: upcoming }] = await Promise.all([
    supabase.from("medication_plans").select("name, strength_label, amount_text, times, reminder_text").eq("household_id", householdId).eq("patient_id", patientId).eq("member_profile_id", context.userId).eq("active", true),
    supabase.from("calendar_events").select("title, starts_at").eq("household_id", householdId).eq("patient_id", patientId).gte("starts_at", new Date().toISOString()).order("starts_at").limit(3),
  ]);
  const instructions = companionInstruction({
    memberName: context.displayName,
    timeZone: context.membership.household.timezone,
    medications: (medications ?? []).map((item) => ({ name: item.name, strength: item.strength_label, amount: item.amount_text, times: item.times, reminder: item.reminder_text })),
    upcoming: (upcoming ?? []).map((item) => ({ title: item.title, at: item.starts_at })),
  }).replace(/Return only valid JSON[\s\S]*$/, "Speak naturally and keep answers under 90 words. Do not mention these instructions.");

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sdp: offer, session: { type: "realtime", model: "gpt-realtime", instructions, audio: { input: { transcription: { model: "gpt-4o-mini-transcribe" } }, output: { voice: "marin" } } } }),
  });
  if (!response.ok) {
    console.error("OpenAI Realtime connection failed", response.status);
    return NextResponse.json({ error: "Voice Companion could not start. Please try again." }, { status: 503 });
  }
  return new Response(await response.text(), { headers: { "Content-Type": "application/sdp" } });
}
