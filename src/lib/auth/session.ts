import { redirect } from "next/navigation";

import { homePathForRole, isCareTeamRole, isHouseholdRole, type HouseholdRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export type HouseholdSummary = {
  id: string;
  name: string;
  supportedPersonName: string | null;
  timezone: string;
  helpConfirmRequired: boolean;
};

export type HouseholdContext = {
  userId: string;
  email: string | null;
  displayName: string;
  membership: {
    role: HouseholdRole;
    household: HouseholdSummary;
  } | null;
};

export async function getHouseholdContext(): Promise<HouseholdContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;

  if (error || !claims || typeof userId !== "string") {
    return null;
  }

  const email = typeof claims.email === "string" ? claims.email : null;

  const [{ data: profile }, { data: membershipRows }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase
      .from("household_members")
      .select("role, household_id")
      .eq("profile_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  let household: HouseholdSummary | null = null;
  if (membershipRows?.household_id) {
    const { data: householdRow } = await supabase
      .from("households")
      .select("id, name, supported_person_name, timezone, help_confirm_required")
      .eq("id", membershipRows.household_id)
      .maybeSingle();
    if (householdRow) {
      household = {
        id: householdRow.id,
        name: householdRow.name,
        supportedPersonName: householdRow.supported_person_name,
        timezone: householdRow.timezone || "America/New_York",
        helpConfirmRequired: householdRow.help_confirm_required ?? true,
      };
    }
  }

  const role =
    membershipRows?.role && isHouseholdRole(membershipRows.role) ? membershipRows.role : null;

  return {
    userId,
    email,
    displayName: profile?.display_name ?? "KindCare member",
    membership: role && household ? { role, household } : null,
  };
}

export async function requireSession() {
  const context = await getHouseholdContext();
  if (!context) redirect("/sign-in");
  return context;
}

export async function requireHousehold() {
  const context = await requireSession();
  if (!context.membership) redirect("/onboarding");
  return context as HouseholdContext & {
    membership: NonNullable<HouseholdContext["membership"]>;
  };
}

export async function requireCareTeam() {
  const context = await requireHousehold();
  if (context.membership.role === "member") redirect("/home");
  return context;
}

export async function requireMemberHome() {
  const context = await requireHousehold();
  if (isCareTeamRole(context.membership.role)) redirect("/today");
  return context;
}

export async function resolveSignedInPath(preferredNext?: string | null) {
  const context = await getHouseholdContext();
  if (!context) return "/sign-in";
  if (preferredNext?.startsWith("/invite/")) return preferredNext;
  if (preferredNext === "/update-password") return preferredNext;
  return homePathForRole(context.membership?.role ?? null);
}
