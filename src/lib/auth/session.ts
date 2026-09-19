import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  homePathForRole,
  isCareTeamRole,
  isHouseholdRole,
  isPatientRole,
  type HouseholdRole,
  type PatientRole,
} from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const PATIENT_COOKIE = "kindcare_patient";

export type HouseholdSummary = {
  id: string;
  name: string;
  supportedPersonName: string | null;
  timezone: string;
  helpConfirmRequired: boolean;
};

export type PatientSummary = {
  id: string;
  householdId: string;
  displayName: string;
  memberProfileId: string | null;
  phone: string | null;
  timezone: string;
  helpConfirmRequired: boolean;
  role: PatientRole;
};

export type HouseholdContext = {
  userId: string;
  email: string | null;
  displayName: string;
  membership: {
    role: HouseholdRole;
    household: HouseholdSummary;
  } | null;
  patients: PatientSummary[];
  activePatient: PatientSummary | null;
};

export type HouseholdSession = HouseholdContext & {
  membership: NonNullable<HouseholdContext["membership"]>;
};

export type CareSession = HouseholdSession & {
  activePatient: PatientSummary;
};

async function preferredPatientId() {
  try {
    return (await cookies()).get(PATIENT_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getHouseholdContext(): Promise<HouseholdContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;

  if (error || !claims || typeof userId !== "string") {
    return null;
  }

  const email = typeof claims.email === "string" ? claims.email : null;

  const [{ data: profile }, { data: membershipRows }, { data: assignmentRows }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase
      .from("household_members")
      .select("role, household_id")
      .eq("profile_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("patient_assignments")
      .select("role, patient_id")
      .eq("profile_id", userId)
      .eq("status", "active"),
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

  const patientIds = [...new Set((assignmentRows ?? []).map((row) => row.patient_id))];
  const { data: patientRows } = patientIds.length
    ? await supabase
        .from("patients")
        .select("id, household_id, display_name, member_profile_id, phone, timezone, help_confirm_required")
        .in("id", patientIds)
    : { data: [] as never[] };

  const patients: PatientSummary[] = (assignmentRows ?? [])
    .map((assignment) => {
      const patient = (patientRows ?? []).find((row) => row.id === assignment.patient_id);
      if (!patient || !isPatientRole(assignment.role)) return null;
      return {
        id: patient.id,
        householdId: patient.household_id,
        displayName: patient.display_name,
        memberProfileId: patient.member_profile_id,
        phone: patient.phone,
        timezone: patient.timezone || household?.timezone || "America/New_York",
        helpConfirmRequired: patient.help_confirm_required ?? true,
        role: assignment.role,
      } satisfies PatientSummary;
    })
    .filter((item): item is PatientSummary => Boolean(item));

  const preferred = await preferredPatientId();
  const activePatient =
    patients.find((patient) => patient.id === preferred) ?? patients[0] ?? null;

  return {
    userId,
    email,
    displayName: profile?.display_name ?? "KindCare member",
    membership: role && household ? { role, household } : null,
    patients,
    activePatient,
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
  return context as HouseholdSession;
}

export async function requireCareTeam() {
  const context = await requireHousehold();
  if (context.activePatient?.role === "patient" || context.membership.role === "member") {
    redirect("/home");
  }
  if (!context.activePatient) redirect("/people");
  return context as CareSession;
}

export async function requireMemberHome() {
  const context = await requireHousehold();
  if (context.activePatient && context.activePatient.role !== "patient") {
    redirect("/today");
  }
  if (isCareTeamRole(context.membership.role) && context.activePatient?.role !== "patient") {
    redirect("/today");
  }
  return context as HouseholdSession & { activePatient: PatientSummary | null };
}

export function careShellProps(context: CareSession) {
  return {
    displayName: context.displayName,
    role: context.membership.role,
    householdName: context.membership.household.name,
    patients: context.patients.map((patient) => ({
      id: patient.id,
      displayName: patient.displayName,
    })),
    activePatientId: context.activePatient.id,
    activePatientName: context.activePatient.displayName,
  };
}

export function patientScope(context: {
  membership: { household: { id: string } };
  activePatient: PatientSummary | null;
}) {
  if (!context.activePatient) {
    throw new Error("Choose a care recipient first.");
  }
  return {
    household_id: context.membership.household.id,
    patient_id: context.activePatient.id,
  };
}

export async function resolveSignedInPath(preferredNext?: string | null) {
  const context = await getHouseholdContext();
  if (!context) return "/sign-in";
  if (preferredNext?.startsWith("/invite/") || preferredNext?.startsWith("/setup/")) {
    return preferredNext;
  }
  if (preferredNext === "/update-password" || preferredNext === "/owner") {
    return preferredNext;
  }
  if (context.activePatient?.role === "patient") return "/home";
  return homePathForRole(context.membership?.role ?? null);
}
