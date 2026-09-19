import { NextResponse } from "next/server";

import { patientScope, requireHousehold } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const context = await requireHousehold();
  const body = (await request.json().catch(() => null)) as { memberText?: unknown; companionText?: unknown } | null;
  const memberText = typeof body?.memberText === "string" ? body.memberText.trim().slice(0, 1200) : "";
  const companionText = typeof body?.companionText === "string" ? body.companionText.trim().slice(0, 1200) : "";
  if (!memberText || !companionText) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const supabase = await createClient();
  const householdId = context.membership.household.id;
  const patientId = patientScope(context).patient_id;
  const { error } = await supabase.from("companion_messages").insert([
    { household_id: householdId, patient_id: patientId, member_profile_id: context.userId, role: "member", content: memberText },
    { household_id: householdId, patient_id: patientId, member_profile_id: context.userId, role: "companion", content: companionText },
  ]);
  if (error) return NextResponse.json({ error: "The conversation could not be saved." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
