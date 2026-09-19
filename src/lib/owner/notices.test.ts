import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isNoticeBlocking,
  isNoticeLive,
  isNoticeStillVisible,
  maintenanceNoticeBody,
  noticeAudienceMatches,
  noticeRequiresAcknowledgement,
  statusForStart,
} from "./notices.ts";

describe("owner service notices", () => {
  it("keeps caregiver notices off the patient audience and the reverse", () => {
    const caregiver = { householdRole: "organizer", patientRoles: ["primary"] };
    const patient = { householdRole: "member", patientRoles: ["patient"] };
    assert.equal(noticeAudienceMatches("all_members", caregiver), true);
    assert.equal(noticeAudienceMatches("all_members", patient), true);
    assert.equal(noticeAudienceMatches("caregivers", caregiver), true);
    assert.equal(noticeAudienceMatches("caregivers", patient), false);
    assert.equal(noticeAudienceMatches("patients", patient), true);
    assert.equal(noticeAudienceMatches("patients", caregiver), false);
  });

  it("treats a scheduled notice as live only after the start time", () => {
    const now = new Date("2026-09-19T15:00:00.000Z");
    assert.equal(
      isNoticeLive({
        status: "scheduled",
        startsAt: "2026-09-19T16:00:00.000Z",
        endsAt: "2026-09-19T18:00:00.000Z",
        now,
      }),
      false,
    );
    assert.equal(
      isNoticeLive({
        status: "scheduled",
        startsAt: "2026-09-19T14:00:00.000Z",
        endsAt: "2026-09-19T18:00:00.000Z",
        now,
      }),
      true,
    );
    assert.equal(
      isNoticeLive({
        status: "published",
        startsAt: "2026-09-19T14:00:00.000Z",
        endsAt: "2026-09-19T14:30:00.000Z",
        now,
      }),
      false,
    );
    assert.equal(
      isNoticeLive({
        status: "draft",
        startsAt: "2026-09-19T14:00:00.000Z",
        endsAt: null,
        now,
      }),
      false,
    );
  });

  it("lets people hide routine updates and keeps important notices until acknowledged", () => {
    assert.equal(noticeRequiresAcknowledgement("routine"), false);
    assert.equal(noticeRequiresAcknowledgement("maintenance"), true);
    assert.equal(
      isNoticeStillVisible({
        priority: "routine",
        dismissedAt: "2026-09-19T15:01:00.000Z",
        acknowledgedAt: null,
      }),
      false,
    );
    assert.equal(
      isNoticeBlocking({
        priority: "maintenance",
        dismissedAt: null,
        acknowledgedAt: null,
      }),
      true,
    );
    assert.equal(
      isNoticeBlocking({
        priority: "maintenance",
        dismissedAt: null,
        acknowledgedAt: "2026-09-19T15:02:00.000Z",
      }),
      false,
    );
  });

  it("writes calm maintenance copy with a start and end time", () => {
    const body = maintenanceNoticeBody({
      startsAt: "2026-09-20T04:00:00.000Z",
      endsAt: "2026-09-20T06:00:00.000Z",
      timeZone: "America/New_York",
    });
    assert.match(body, /KindCare will be unavailable for maintenance from /);
    assert.doesNotMatch(body, /emergency|URGENT|!!!/i);
    assert.equal(statusForStart("2099-01-01T00:00:00.000Z", new Date("2026-09-19T00:00:00.000Z")), "scheduled");
    assert.equal(statusForStart("2020-01-01T00:00:00.000Z", new Date("2026-09-19T00:00:00.000Z")), "published");
  });
});
