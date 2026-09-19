"use client";

import { setActivePatient } from "@/app/patient-actions";

export function PatientSwitcher({
  patients,
  activePatientId,
}: {
  patients: { id: string; displayName: string }[];
  activePatientId: string;
}) {
  if (patients.length < 2) return null;

  return (
    <form action={setActivePatient} className="flex flex-wrap items-center gap-2">
      <label className="text-sm font-semibold text-navy" htmlFor="kindcare-patient">
        Care recipient
      </label>
      <select
        id="kindcare-patient"
        name="patientId"
        defaultValue={activePatientId}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="min-h-10 rounded-xl border border-navy/15 bg-white px-3 text-sm text-navy"
      >
        {patients.map((patient) => (
          <option key={patient.id} value={patient.id}>
            {patient.displayName}
          </option>
        ))}
      </select>
    </form>
  );
}
