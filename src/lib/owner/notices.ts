export const serviceNoticeAudiences = ["all_members", "caregivers", "patients"] as const;
export type ServiceNoticeAudience = (typeof serviceNoticeAudiences)[number];

export const serviceNoticePriorities = ["routine", "important", "maintenance"] as const;
export type ServiceNoticePriority = (typeof serviceNoticePriorities)[number];

export const serviceNoticeStatuses = [
  "draft",
  "scheduled",
  "published",
  "expired",
  "archived",
] as const;
export type ServiceNoticeStatus = (typeof serviceNoticeStatuses)[number];

export const serviceNoticeAudienceLabels: Record<ServiceNoticeAudience, string> = {
  all_members: "Everyone signed in",
  caregivers: "Caregivers only",
  patients: "Patients only",
};

export const serviceNoticePriorityLabels: Record<ServiceNoticePriority, string> = {
  routine: "Routine update",
  important: "Important",
  maintenance: "Maintenance",
};

export const serviceNoticeStatusLabels: Record<ServiceNoticeStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  expired: "Ended",
  archived: "Archived",
};

export type ServiceNoticeViewer = {
  householdRole: string | null;
  patientRoles: string[];
};

const careHouseholdRoles = new Set(["organizer", "caregiver", "helper"]);
const carePatientRoles = new Set(["primary", "backup_primary", "caregiver", "helper"]);

export function isServiceNoticeAudience(value: string): value is ServiceNoticeAudience {
  return (serviceNoticeAudiences as readonly string[]).includes(value);
}

export function isServiceNoticePriority(value: string): value is ServiceNoticePriority {
  return (serviceNoticePriorities as readonly string[]).includes(value);
}

export function isServiceNoticeStatus(value: string): value is ServiceNoticeStatus {
  return (serviceNoticeStatuses as readonly string[]).includes(value);
}

export function noticeAudienceMatches(
  audience: ServiceNoticeAudience,
  viewer: ServiceNoticeViewer,
) {
  if (audience === "all_members") return Boolean(viewer.householdRole);
  if (audience === "caregivers") {
    return (
      Boolean(viewer.householdRole && careHouseholdRoles.has(viewer.householdRole)) ||
      viewer.patientRoles.some((role) => carePatientRoles.has(role))
    );
  }
  return viewer.householdRole === "member" || viewer.patientRoles.includes("patient");
}

export function isNoticeLive(params: {
  status: ServiceNoticeStatus;
  startsAt: string;
  endsAt: string | null;
  archivedAt?: string | null;
  now?: Date;
}) {
  if (params.archivedAt) return false;
  if (params.status !== "published" && params.status !== "scheduled") return false;
  const now = params.now ?? new Date();
  if (new Date(params.startsAt).getTime() > now.getTime()) return false;
  if (params.endsAt && new Date(params.endsAt).getTime() <= now.getTime()) return false;
  return true;
}

export function noticeRequiresAcknowledgement(priority: ServiceNoticePriority) {
  return priority === "important" || priority === "maintenance";
}

export function isNoticeBlocking(params: {
  priority: ServiceNoticePriority;
  dismissedAt: string | null;
  acknowledgedAt: string | null;
}) {
  if (params.dismissedAt || params.acknowledgedAt) return false;
  return noticeRequiresAcknowledgement(params.priority);
}

export function isNoticeStillVisible(params: {
  priority: ServiceNoticePriority;
  dismissedAt: string | null;
  acknowledgedAt: string | null;
}) {
  if (params.acknowledgedAt || params.dismissedAt) return false;
  return true;
}

export function maintenanceNoticeBody(params: {
  startsAt: string;
  endsAt: string | null;
  timeZone: string;
}) {
  const from = formatNoticeWhen(params.startsAt, params.timeZone);
  if (!params.endsAt) {
    return `KindCare will be unavailable for maintenance starting ${from}.`;
  }
  return `KindCare will be unavailable for maintenance from ${from} to ${formatNoticeWhen(params.endsAt, params.timeZone)}.`;
}

export function formatNoticeWhen(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function isoToLocalInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function statusForStart(startsAt: string, now = new Date()) {
  return new Date(startsAt).getTime() > now.getTime() ? "scheduled" : "published";
}
