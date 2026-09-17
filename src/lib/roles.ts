export const householdRoles = ["organizer", "caregiver", "helper", "member"] as const;

export type HouseholdRole = (typeof householdRoles)[number];

export const inviteRoles = ["caregiver", "helper", "member"] as const;

export type InviteRole = (typeof inviteRoles)[number];

export const roleLabels: Record<HouseholdRole, string> = {
  organizer: "Organizer",
  caregiver: "Caregiver",
  helper: "Trusted helper",
  member: "Member",
};

export function isHouseholdRole(value: string): value is HouseholdRole {
  return (householdRoles as readonly string[]).includes(value);
}

export function isInviteRole(value: string): value is InviteRole {
  return (inviteRoles as readonly string[]).includes(value);
}

export function isCareTeamRole(role: HouseholdRole) {
  return role === "organizer" || role === "caregiver" || role === "helper";
}

export function canManagePlan(role: HouseholdRole) {
  return role === "organizer" || role === "caregiver";
}

export function canEditCalendar(role: HouseholdRole) {
  return isCareTeamRole(role);
}

export function homePathForRole(role: HouseholdRole | null) {
  if (role === "member") return "/home";
  if (role) return "/today";
  return "/onboarding";
}
