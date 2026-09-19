import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assignmentsForPatient,
  isSetupTokenFormat,
  patientSetupMessage,
  randomPatientEmail,
} from "./patient-setup.ts";

describe("patient setup helpers", () => {
  it("accepts 64-character hex setup tokens only", () => {
    assert.equal(isSetupTokenFormat("a".repeat(64)), true);
    assert.equal(isSetupTokenFormat("not-a-token"), false);
    assert.equal(isSetupTokenFormat(""), false);
  });

  it("keeps setup copy off the App Store", () => {
    const message = patientSetupMessage({
      patientName: "Mary",
      caregiverName: "Adam",
      setupUrl: "https://kindcare.app/setup/abc",
    });
    assert.match(message, /Mary/);
    assert.match(message, /Adam/);
    assert.match(message, /kindcare.app\/setup\/abc/);
    assert.match(message, /will not need the App Store/i);
    assert.doesNotMatch(message, /download (KindCare )?from the App Store/i);
  });

  it("scopes assignments to one patient", () => {
    const rows = [
      { patientId: "mary", title: "Mary meds" },
      { patientId: "other", title: "Patient 3 calendar" },
    ];
    assert.deepEqual(assignmentsForPatient(rows, "mary"), [{ patientId: "mary", title: "Mary meds" }]);
  });

  it("derives a unique generated login mailbox from the patient id", () => {
    assert.equal(
      randomPatientEmail("11111111-2222-3333-4444-555555555555"),
      "patient.11111111222233334444555555555555@users.kindcare.app",
    );
  });
});
