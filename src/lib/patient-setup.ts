export const SETUP_INVITE_DAYS = 7;

export function isSetupTokenFormat(token: string) {
  return /^[0-9a-f]{64}$/i.test(token);
}

export function patientSetupMessage(params: {
  patientName: string;
  caregiverName: string;
  setupUrl: string;
}) {
  return `${params.caregiverName} set up KindCare for ${params.patientName}. Open this link on your phone. You will not need the App Store.\n\n${params.setupUrl}`;
}

export const patientCareRoles = ["primary", "backup_primary", "caregiver", "helper"] as const;
export const patientMemberRole = "patient" as const;

export function assignmentsForPatient<T extends { patientId: string }>(
  rows: T[],
  patientId: string,
) {
  return rows.filter((row) => row.patientId === patientId);
}

export function randomPatientEmail(patientId: string) {
  return `patient.${patientId.replace(/-/g, "")}@users.kindcare.app`;
}
