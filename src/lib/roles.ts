export const householdRoles = ["organizer", "caregiver", "helper", "member"] as const;

export type HouseholdRole = (typeof householdRoles)[number];

export const inviteRoles = ["caregiver", "helper", "member"] as const;

export type InviteRole = (typeof inviteRoles)[number];

export const patientRoles = ["patient", "primary", "backup_primary", "caregiver", "helper"] as const;

export type PatientRole = (typeof patientRoles)[number];

export const roleLabels: Record<HouseholdRole, string> = {
  organizer: "Organizer",
  caregiver: "Caregiver",
  helper: "Trusted helper",
  member: "Member",
};

export const patientRoleLabels: Record<PatientRole, string> = {
  patient: "Patient",
  primary: "Primary caregiver",
  backup_primary: "Backup primary",
  caregiver: "Caregiver",
  helper: "Trusted helper",
};

export function isHouseholdRole(value: string): value is HouseholdRole {
  return (householdRoles as readonly string[]).includes(value);
}

export function isInviteRole(value: string): value is InviteRole {
  return (inviteRoles as readonly string[]).includes(value);
}

export function isPatientRole(value: string): value is PatientRole {
  return (patientRoles as readonly string[]).includes(value);
}

export function isCareTeamRole(role: HouseholdRole) {
  return role === "organizer" || role === "caregiver" || role === "helper";
}

export function isPatientCareRole(role: PatientRole) {
  return role === "primary" || role === "backup_primary" || role === "caregiver" || role === "helper";
}

export function canManagePlan(role: HouseholdRole) {
  return role === "organizer" || role === "caregiver";
}

export function canManagePatientPlan(role: PatientRole) {
  return role === "primary" || role === "backup_primary" || role === "caregiver";
}

export function canEditCalendar(role: HouseholdRole) {
  return isCareTeamRole(role);
}

export function homePathForRole(role: HouseholdRole | null) {
  if (role === "member") return "/home";
  if (role) return "/today";
  return "/onboarding";
}
