import { notFound, redirect } from "next/navigation";

import { isKindCareOwner, ownerSignInHref } from "@/lib/auth/owner";
import { getHouseholdContext } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";

export async function requireOwner() {
  const context = await getHouseholdContext();
  if (!context) {
    redirect(ownerSignInHref("/owner"));
  }
  if (!isKindCareOwner(context.email)) {
    notFound();
  }
  return context;
}

export async function auditOwnerAccess(params: {
  actorProfileId: string;
  eventType: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const supabase = createServiceClient();
  await supabase.from("audit_events").insert({
    household_id: null,
    actor_profile_id: params.actorProfileId,
    event_type: params.eventType,
    outcome: "success",
    metadata: params.metadata ?? {},
  });
}
